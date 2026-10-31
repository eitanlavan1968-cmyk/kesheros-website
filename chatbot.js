/* KesherOS marketing chat widget. One script tag: <script src="chatbot.js" data-api="https://API-HOST" defer></script>
   Hebrew only. No third-party code except Cloudflare Turnstile, loaded only when the server asks for it.
   Every string from the server is written with textContent, never as HTML. The conversation lives in memory only (nothing is saved in the browser).
   Leaving details is a separate screen, opened only by a button the visitor presses (inside an answer that had no answer, or when the service is off). */
(function () {
  'use strict';
  var script = document.currentScript;
  var API = ((script && script.getAttribute('data-api')) || '').replace(/\/+$/, '');
  var T = {
    open: "פתיחת צ'אט עם עוזר AI", title: 'שאלות על KesherOS', close: 'סגירה',
    intro: 'שלום! אני עוזר AI של KesherOS ולא אדם. אפשר לשאול אותי על המערכת. אם אין לי תשובה, אפשר להשאיר פרטים ונציג יחזור אליכם.',
    placeholder: 'כתבו שאלה…', send: 'שליחה', thinking: 'חושב…',
    error: 'משהו השתבש. אפשר לנסות שוב או להשאיר פרטים.', limit: 'הגעתם למגבלת ההודעות בשיחה הזו. אפשר להשאיר פרטים ונציג יחזור אליכם.',
    rate: 'יותר מדי הודעות בזמן קצר. נסו שוב בעוד כמה דקות.', unavailable: 'העוזר אינו זמין כרגע. אפשר להשאיר פרטים ונציג יחזור אליכם.',
    leave: 'השארת פרטים', leaveTitle: 'השארת פרטים', leaveSub: 'נציג יחזור אליכם בהקדם.', back: 'חזרה לשיחה',
    name: 'שם', contact: 'טלפון או אימייל', more: '+ פרטים נוספים (לא חובה)', less: '− הסתרת פרטים נוספים', org: 'יישוב / ארגון', interest: 'במה תרצו שנעזור?',
    consent: 'אני מסכימ/ה שיצרו איתי קשר בנוגע לפנייה זו', submit: 'שליחת פרטים', thanks: 'תודה! הפרטים התקבלו ונציג יחזור אליכם.',
    need: 'יש למלא שם, טלפון או אימייל ולאשר את ההסכמה.', ai: 'העוזר הוא בינה מלאכותית ועלול לטעות. אל תשלחו כאן מידע אישי רגיש.', fab: 'שאלו אותנו'
  };
  var state = { cid: null, history: [], cfg: null, busy: false, open: false, token: '', lead: false };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function post(path, body) {
    return fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); });
  }

  var root = el('div', 'kc-root'); root.setAttribute('dir', 'rtl');
  var fab = el('button', 'kc-fab', T.fab); fab.type = 'button'; fab.setAttribute('aria-label', T.open); fab.setAttribute('aria-expanded', 'false');
  var panel = el('section', 'kc-panel'); panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', T.title);

  var head = el('header', 'kc-head');
  var backBtn = el('button', 'kc-back', '→ ' + T.back); backBtn.type = 'button'; backBtn.hidden = true;
  var title = el('strong', 'kc-title', T.title);
  var closeBtn = el('button', 'kc-close', '×'); closeBtn.type = 'button'; closeBtn.setAttribute('aria-label', T.close);
  head.appendChild(backBtn); head.appendChild(title); head.appendChild(closeBtn);

  var log = el('div', 'kc-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite');
  var note = el('p', 'kc-note', T.ai);
  var form = el('form', 'kc-form');
  var input = el('input', 'kc-input'); input.type = 'text'; input.setAttribute('aria-label', T.placeholder); input.placeholder = T.placeholder; input.autocomplete = 'off'; input.maxLength = 500;
  var sendBtn = el('button', 'kc-send', T.send); sendBtn.type = 'submit';
  form.appendChild(input); form.appendChild(sendBtn);
  var captchaBox = el('div', 'kc-captcha');
  var leadScreen = el('form', 'kc-lead'); leadScreen.hidden = true; leadScreen.noValidate = true;
  panel.appendChild(head); panel.appendChild(log); panel.appendChild(note); panel.appendChild(form); panel.appendChild(leadScreen); panel.appendChild(captchaBox);
  root.appendChild(panel); root.appendChild(fab);

  /* a bubble; withLead adds the "leave details" button inside it (the only way into the form, besides a switched-off service) */
  function fill(m, text, withLead) {
    m.textContent = ''; m.appendChild(el('span', 'kc-text', text));
    if (withLead) { var b = el('button', 'kc-cta', T.leave); b.type = 'button'; b.onclick = showLead; m.appendChild(document.createElement('br')); m.appendChild(b); }
  }
  function say(who, text, withLead) {
    var m = el('div', 'kc-msg kc-' + who); fill(m, text, withLead); log.appendChild(m); log.scrollTop = log.scrollHeight; return m;
  }

  function buildLead() {
    leadScreen.textContent = '';
    var f = {};
    leadScreen.appendChild(el('h3', 'kc-h', T.leaveTitle)); leadScreen.appendChild(el('p', 'kc-sub', T.leaveSub));
    function field(key, label, wrap) {
      var l = el('label', 'kc-label', label); var i = el('input', 'kc-input'); i.type = 'text'; i.maxLength = 160; l.appendChild(i); (wrap || leadScreen).appendChild(l); f[key] = i;
    }
    field('name', T.name); field('contact', T.contact);
    var extra = el('div', 'kc-extra'); extra.hidden = true; field('org', T.org, extra); field('interest', T.interest, extra);
    var moreBtn = el('button', 'kc-more', T.more); moreBtn.type = 'button'; moreBtn.setAttribute('aria-expanded', 'false');
    moreBtn.onclick = function () { extra.hidden = !extra.hidden; moreBtn.textContent = extra.hidden ? T.more : T.less; moreBtn.setAttribute('aria-expanded', extra.hidden ? 'false' : 'true'); };
    leadScreen.appendChild(moreBtn); leadScreen.appendChild(extra);
    var cl = el('label', 'kc-check'); var cb = el('input'); cb.type = 'checkbox'; cl.appendChild(cb); cl.appendChild(el('span', '', T.consent)); leadScreen.appendChild(cl);
    var err = el('p', 'kc-err'); err.setAttribute('role', 'alert'); leadScreen.appendChild(err);
    var go = el('button', 'kc-submit', T.submit); go.type = 'submit'; leadScreen.appendChild(go);
    leadScreen.onsubmit = function (ev) {
      ev.preventDefault();
      if (!f.name.value.trim() || !f.contact.value.trim() || !cb.checked) { err.textContent = T.need; (f.name.value.trim() ? f.contact : f.name).focus(); return; }
      err.textContent = ''; go.disabled = true;
      post('/api/lead', { conversation_id: state.cid, name: f.name.value, contact: f.contact.value, org: f.org.value, interest: f.interest.value, consent: true, turnstile_token: state.token })
        .then(function (r) {
          if (r.body && r.body.ok) {
            leadScreen.textContent = ''; leadScreen.appendChild(el('h3', 'kc-h', T.thanks));
            if (!(state.cfg && state.cfg.enabled === false)) { var bk = el('button', 'kc-submit', T.back); bk.type = 'button'; bk.onclick = hideLead; leadScreen.appendChild(bk); bk.focus(); }
          } else { err.textContent = r.status === 429 ? T.rate : T.error; go.disabled = false; }
        }).catch(function () { err.textContent = T.error; go.disabled = false; });
    };
    return f;
  }

  function showLead() {
    state.lead = true; var f = buildLead();
    panel.classList.add('kc-lead-open'); leadScreen.hidden = false; title.hidden = true;
    backBtn.hidden = !!(state.cfg && state.cfg.enabled === false);        // nothing to go back to when the chat is off
    f.name.focus();
  }
  function hideLead() {
    state.lead = false; panel.classList.remove('kc-lead-open'); leadScreen.hidden = true; backBtn.hidden = true; title.hidden = false;
    if (!form.hidden) input.focus();
  }
  backBtn.onclick = hideLead;

  function loadCaptcha(cfg) {
    if (!cfg.turnstile || !cfg.turnstile_sitekey) return;
    window.__kcTurnstile = function () {
      window.turnstile.render(captchaBox, { sitekey: cfg.turnstile_sitekey, language: 'he', appearance: 'interaction-only', callback: function (t) { state.token = t; }, 'expired-callback': function () { state.token = ''; } });
    };
    var s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__kcTurnstile'; s.async = true; document.head.appendChild(s);
  }

  function chatOff() { state.cfg = state.cfg || {}; state.cfg.enabled = false; form.hidden = true; note.hidden = true; say('bot', T.unavailable); showLead(); }

  function ensureConfig() {
    if (state.cfg) return Promise.resolve(state.cfg);
    return fetch(API + '/api/config').then(function (r) { return r.json(); }).then(function (c) {
      state.cfg = c; input.maxLength = c.max_message_chars || 500; loadCaptcha(c);
      if (!c.enabled) chatOff();
      return c;
    }).catch(function () { chatOff(); });
  }

  function openPanel(on) {
    state.open = on; panel.hidden = !on; fab.setAttribute('aria-expanded', on ? 'true' : 'false'); fab.hidden = on;
    if (on) { if (!log.children.length) say('bot', T.intro); ensureConfig().then(function () { if (!form.hidden && !state.lead) input.focus(); }); }
    else fab.focus();
  }
  fab.onclick = function () { openPanel(true); };
  closeBtn.onclick = function () { openPanel(false); };
  root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.open) openPanel(false); });

  form.onsubmit = function (ev) {
    ev.preventDefault();
    var text = input.value.trim();
    if (!text || state.busy) return;
    state.busy = true; sendBtn.disabled = true; input.value = '';
    say('me', text);
    var wait = say('bot', T.thinking);
    post('/api/chat', { message: text, conversation_id: state.cid, history: state.history.slice(-6), turnstile_token: state.token })
      .then(function (r) {
        var b = r.body || {};
        if (r.status === 200 && b.answer) {
          fill(wait, b.answer, !!b.handoff); state.cid = b.conversation_id || state.cid;
          state.history.push({ role: 'user', content: text }, { role: 'assistant', content: b.answer });
        } else {
          var tooMany = b.error === 'too_many_turns';
          fill(wait, r.status === 429 ? (tooMany ? T.limit : T.rate) : (r.status === 503 ? T.unavailable : T.error), r.status !== 429 || tooMany);
        }
        if (window.turnstile && state.token) { try { window.turnstile.reset(); state.token = ''; } catch (e) { /* the next send gets a fresh token */ } }
      })
      .catch(function () { fill(wait, T.error, true); })
      .then(function () { state.busy = false; sendBtn.disabled = false; if (!form.hidden && !state.lead) input.focus(); });
  };

  function mount() { document.body.appendChild(root); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
