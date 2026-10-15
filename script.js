/* ═══════════════════════════════════════════════════════════
   KesherOS Marketing — script.js
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Scroll-reveal observer ─── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ─── Header scroll effect + scroll progress bar ─── */
  const header = document.querySelector('.site-header');
  const progressBar = document.querySelector('.scroll-progress');
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.toggleAttribute('data-scrolled', window.scrollY > 60);
        // Update scroll progress bar
        if (progressBar) {
          var scrollTop = window.scrollY;
          var docHeight = document.documentElement.scrollHeight - window.innerHeight;
          progressBar.style.width = docHeight > 0 ? (scrollTop / docHeight * 100) + '%' : '0%';
        }
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─── Active nav section highlight ─── */
  const navLinks = document.querySelectorAll('.header-nav a[href^="#"]');
  const sections = [];
  navLinks.forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (sec) sections.push({ el: sec, link: a });
  });

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const match = sections.find((s) => s.el === entry.target);
        if (match) match.link.classList.toggle('active', entry.isIntersecting);
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  sections.forEach((s) => navObserver.observe(s.el));

  /* ─── Stat counter animation ─── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(eased * target);
      el.textContent = current.toLocaleString('he-IL') + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Delay counter observer until gate/preloader clears (so hero stats animate visibly)
  function startCounters() {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            animateCounter(e.target);
            counterObserver.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll('[data-count]').forEach(function (el) { counterObserver.observe(el); });
  }
  var gate = document.getElementById('site-gate');
  if (gate) {
    // Wait for gate to be removed, then start counters
    var gateCheck = setInterval(function () {
      if (!document.getElementById('site-gate')) { clearInterval(gateCheck); startCounters(); }
    }, 200);
  } else {
    startCounters();
  }

  /* ─── Mobile menu toggle ─── */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.header-nav');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
      if (!open) { const first = nav.querySelector('a'); if (first) first.focus(); }
    });
  }
  // Close on link click
  if (nav) {
    nav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
        document.querySelector('.menu-overlay')?.classList.remove('visible');
      })
    );
  }

  // Mobile menu overlay — close menu when tapping backdrop
  var overlay = document.querySelector('.menu-overlay');
  if (overlay && toggle) {
    overlay.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }

  // Show/hide overlay with menu
  if (toggle && overlay) {
    var origToggleClick = toggle.onclick;
    toggle.addEventListener('click', function () {
      var open = nav.classList.contains('open');
      overlay.classList.toggle('visible', open);
    });
  }

  /* ─── Keyboard: Escape closes open panels ─── */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    // Close mobile menu
    if (nav && nav.classList.contains('open')) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      if (overlay) overlay.classList.remove('visible');
      toggle.focus();
      return;
    }
    // Close a11y panel
    var a11yP = document.querySelector('.a11y-panel');
    if (a11yP && !a11yP.hidden) {
      a11yP.hidden = true;
      document.querySelector('.a11y-fab')?.focus();
      return;
    }
  });

  /* ─── Demo tab switching with transition ─── */
  var activePanel = document.querySelector('.demo-panel[style*="block"]') ||
                    document.querySelector('.demo-panel');
  document.querySelectorAll('.demo-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      var nextPanel = document.getElementById('demo-' + tab.dataset.panel);
      if (!nextPanel || nextPanel === activePanel) return;

      // Update tabs
      document.querySelectorAll('.demo-tab').forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Animate: fade out old → fade in new
      if (activePanel) {
        activePanel.classList.add('panel-exit');
        activePanel.addEventListener('animationend', function handler() {
          activePanel.removeEventListener('animationend', handler);
          activePanel.style.display = 'none';
          activePanel.classList.remove('panel-exit');
          nextPanel.style.display = 'block';
          nextPanel.classList.add('panel-enter');
          nextPanel.addEventListener('animationend', function h2() {
            nextPanel.removeEventListener('animationend', h2);
            nextPanel.classList.remove('panel-enter');
          });
          activePanel = nextPanel;
          // Animate counters in the new panel
          nextPanel.querySelectorAll('[data-demo-count]').forEach(animateDemoCounter);
        });
      } else {
        nextPanel.style.display = 'block';
        activePanel = nextPanel;
      }
    });
  });

  /* ─── Demo counter animation (fan panel numbers) ─── */
  function animateDemoCounter(el) {
    var target = parseInt(el.dataset.demoCount, 10);
    var suffix = el.dataset.demoSuffix || '';
    var prefix = el.dataset.demoPrefix || '';
    var duration = 1200;
    var start = performance.now();
    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(eased * target);
      el.textContent = prefix + current.toLocaleString('he-IL') + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  // Initial run for visible panel
  if (activePanel) {
    activePanel.querySelectorAll('[data-demo-count]').forEach(animateDemoCounter);
  }


  /* ─── Plan matcher — one field instead of making people cross-reference tiers ─── */
  var pmInput = document.getElementById('pm-input');
  var pmOut = document.getElementById('pm-out');
  if (pmInput && pmOut) {
    // index into .price-card in DOM order: Start, Community, Professional
    var PM_TIERS = [
      { max: 150, i: 0, name: 'Kesher Start' },
      { max: 400, i: 1, name: 'Kesher Community' },
      { max: 800, i: 2, name: 'Kesher Professional' }
    ];
    pmInput.addEventListener('input', function () {
      var cards = document.querySelectorAll('.price-card');
      cards.forEach(function (c) { c.classList.remove('pm-hit'); });

      var n = parseInt(pmInput.value, 10);
      if (!n || n < 1) { pmOut.textContent = ''; return; }

      var hit = null;
      for (var i = 0; i < PM_TIERS.length; i++) {
        if (n <= PM_TIERS[i].max) { hit = PM_TIERS[i]; break; }
      }
      if (!hit) {
        pmOut.innerHTML = '\u05DC\u05E7\u05D4\u05D9\u05DC\u05D4 \u05D1\u05D2\u05D5\u05D3\u05DC \u05D4\u05D6\u05D4 \u05E0\u05EA\u05D0\u05D9\u05DD \u05D7\u05D1\u05D9\u05DC\u05D4 \u05D0\u05D9\u05E9\u05D9\u05EA \u2014 <a href="#contact">\u05D3\u05D1\u05E8\u05D5 \u05D0\u05D9\u05EA\u05E0\u05D5</a>.';
        return;
      }
      if (cards[hit.i]) cards[hit.i].classList.add('pm-hit');
      pmOut.innerHTML = '\u05D4\u05DE\u05E1\u05DC\u05D5\u05DC \u05E9\u05DE\u05EA\u05D0\u05D9\u05DD \u05DC\u05DB\u05DD: <strong>' + hit.name + '</strong>';
    });
  }

  /* ─── Back-to-top FAB ─── */
  var bttBtn = document.querySelector('.btt-fab');
  if (bttBtn) {
    var bttObserver = new IntersectionObserver(function (entries) {
      // Show button when hero is NOT visible (scrolled past it)
      bttBtn.classList.toggle('visible', !entries[0].isIntersecting);
    }, { threshold: 0 });
    var heroSection = document.querySelector('.hero');
    if (heroSection) bttObserver.observe(heroSection);
    bttBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ─── Mobile sticky CTA bar — hide when contact section is visible ─── */
  var ctaBar = document.querySelector('.mobile-cta-bar');
  if (ctaBar) {
    var ctaSection = document.getElementById('contact');
    if (ctaSection) {
      var ctaObserver = new IntersectionObserver(function (entries) {
        ctaBar.classList.toggle('hidden', entries[0].isIntersecting);
      }, { threshold: 0.15 });
      ctaObserver.observe(ctaSection);
    }
  }

  /* ─── Dark / light theme toggle ─── */
  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    // Restore saved theme (default is dark via HTML attribute)
    var saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    else document.documentElement.setAttribute('data-theme', 'dark');

    themeBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var isDark;
      if (current === 'dark') isDark = true;
      else if (current === 'light') isDark = false;
      else isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      var next = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  /* ─── Accessibility panel ─── */
  var a11yFab = document.querySelector('.a11y-fab');
  var a11yPanel = document.querySelector('.a11y-panel');
  if (a11yFab && a11yPanel) {
    var root = document.documentElement;
    var fontStep = 0; // -2 to +4

    // Restore saved state
    var a11yState = JSON.parse(localStorage.getItem('a11y') || '{}');
    if (a11yState.font) { fontStep = a11yState.font; root.style.fontSize = (16 + fontStep * 2) + 'px'; }
    if (a11yState.contrast) { root.classList.add('a11y-high-contrast'); setToggle('contrast', true); }
    if (a11yState.links) { root.classList.add('a11y-highlight-links'); setToggle('links', true); }
    if (a11yState.motion) { root.classList.add('a11y-stop-motion'); setToggle('motion', true); }
    // Sync theme label
    var themeLabel = a11yPanel.querySelector('[data-a11y="theme"]');
    if (themeLabel) themeLabel.textContent = (root.getAttribute('data-theme') || 'dark') === 'dark' ? 'כהה' : 'בהיר';

    function saveA11y() {
      localStorage.setItem('a11y', JSON.stringify({
        font: fontStep || undefined,
        contrast: root.classList.contains('a11y-high-contrast') || undefined,
        links: root.classList.contains('a11y-highlight-links') || undefined,
        motion: root.classList.contains('a11y-stop-motion') || undefined
      }));
    }

    function setToggle(key, on) {
      var btn = a11yPanel.querySelector('[data-a11y="' + key + '"]');
      if (btn) { btn.setAttribute('aria-pressed', String(on)); btn.textContent = on ? 'פעיל' : 'כבוי'; }
    }

    a11yFab.addEventListener('click', function () {
      var open = !a11yPanel.hidden;
      a11yPanel.hidden = open;
      a11yFab.setAttribute('aria-expanded', String(!open));
    });

    a11yPanel.querySelector('.a11y-close').addEventListener('click', function () {
      a11yPanel.hidden = true;
      a11yFab.setAttribute('aria-expanded', 'false');
    });

    a11yPanel.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-a11y]');
      if (!btn) return;
      var action = btn.dataset.a11y;

      if (action === 'font-up' && fontStep < 4) { fontStep++; root.style.fontSize = (16 + fontStep * 2) + 'px'; }
      else if (action === 'font-down' && fontStep > -2) { fontStep--; root.style.fontSize = (16 + fontStep * 2) + 'px'; }
      else if (action === 'font-reset') { fontStep = 0; root.style.fontSize = ''; }
      else if (action === 'contrast') { root.classList.toggle('a11y-high-contrast'); setToggle('contrast', root.classList.contains('a11y-high-contrast')); }
      else if (action === 'links') { root.classList.toggle('a11y-highlight-links'); setToggle('links', root.classList.contains('a11y-highlight-links')); }
      else if (action === 'motion') { root.classList.toggle('a11y-stop-motion'); setToggle('motion', root.classList.contains('a11y-stop-motion')); }
      else if (action === 'theme') {
        // Mirror the header theme toggle logic
        var cur = root.getAttribute('data-theme');
        var next = cur === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        btn.textContent = next === 'dark' ? 'כהה' : 'בהיר';
      }
      else if (action === 'reset-all') {
        fontStep = 0; root.style.fontSize = '';
        root.classList.remove('a11y-high-contrast', 'a11y-highlight-links', 'a11y-stop-motion');
        setToggle('contrast', false); setToggle('links', false); setToggle('motion', false);
      }
      saveA11y();
    });
  }

  /* ─── Section nav dots ─── */
  var dotsNav = document.querySelector('.section-dots');
  if (dotsNav) {
    var dots = dotsNav.querySelectorAll('.dot');
    // Show dots only after scrolling past hero
    var heroEl = document.querySelector('.hero');
    if (heroEl) {
      var dotsShowObserver = new IntersectionObserver(function (entries) {
        dotsNav.classList.toggle('visible', !entries[0].isIntersecting);
      }, { threshold: 0 });
      dotsShowObserver.observe(heroEl);
    }
    // Highlight active dot
    var dotSections = [];
    dots.forEach(function (d) {
      var sec = document.getElementById(d.dataset.section);
      if (sec) dotSections.push({ el: sec, dot: d });
    });
    var dotObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var match = dotSections.find(function (s) { return s.el === entry.target; });
        if (match) match.dot.classList.toggle('active', entry.isIntersecting);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    dotSections.forEach(function (s) { dotObserver.observe(s.el); });
    // Click handler with smooth scroll offset
    dots.forEach(function (d) {
      d.addEventListener('click', function (e) {
        e.preventDefault();
        var sec = document.getElementById(d.dataset.section);
        if (sec) {
          var hH = document.querySelector('.site-header').offsetHeight || 68;
          window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY - hH - 12, behavior: 'smooth' });
        }
      });
    });
  }

  /* ─── Price count-up animation ─── */
  var priceEls = document.querySelectorAll('[data-price]');
  if (priceEls.length) {
    var priceObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        priceObserver.unobserve(e.target);
        var target = parseInt(e.target.dataset.price, 10);
        var duration = 1400;
        var start = performance.now();
        function tick(now) {
          var elapsed = now - start;
          var progress = Math.min(elapsed / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = Math.round(eased * target);
          e.target.textContent = '₪' + current.toLocaleString('he-IL');
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    priceEls.forEach(function (el) { priceObserver.observe(el); });
  }

  /* ─── AI chat sequential conversation effect ─── */
  var chatMock = document.querySelector('.chat-mock');
  if (chatMock) {
    var allMsgs = chatMock.querySelectorAll('.chat-msg');
    // Hide all messages initially (visibility, not display: they must keep
    //  their space or the section grows as each one appears)
    allMsgs.forEach(function (m) { m.classList.add('chat-hidden'); });

    var chatObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        chatObserver.unobserve(entry.target);
        var delay = 400;
        allMsgs.forEach(function (m, i) {
          var isAI = m.classList.contains('ai');
          if (isAI) {
            // Show typing dots first, then reveal content
            setTimeout(function () {
              m.classList.remove('chat-hidden');
              m.classList.add('typing-dots');
            }, delay);
            delay += 800;
            setTimeout(function () {
              m.classList.remove('typing-dots');
              m.classList.add('chat-appear');
            }, delay);
            delay += 400;
          } else {
            // User message — just appear
            setTimeout(function () {
              m.classList.remove('chat-hidden');
              m.classList.add('chat-appear');
            }, delay);
            delay += 600;
          }
        });
      });
    }, { threshold: 0.2 });
    chatObserver.observe(chatMock);
  }

  /* ─── Smooth scroll for anchor links (with header offset) ─── */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var headerH = document.querySelector('.site-header').offsetHeight || 68;
        var top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });
  /* ─── "Developing with AI since January 2025": the phrase moves on its own, every six months ───
     Aug 2026 "שנתיים" -> Feb 2027 "למעלה משנתיים" -> Aug 2027 "שלוש שנים" -> Feb 2028 "למעלה משלוש שנים" ...
     (the static text in the HTML is only what shows without JavaScript; update it when the phase changes if you want it exact there too) */
  (function () {
    var WORDS = { 3: 'שלוש', 4: 'ארבע', 5: 'חמש', 6: 'שש', 7: 'שבע', 8: 'שמונה', 9: 'תשע', 10: 'עשר' };
    function years(n) { return n === 1 ? 'שנה' : n === 2 ? 'שנתיים' : (WORDS[n] || n) + ' שנים'; }
    function aiYearsPhrase(now) {
      var m = (now.getFullYear() - 2025) * 12 + now.getMonth();      // months since January 2025 (January 2025 = 0)
      var p = Math.floor((m - 1) / 6);                               // half-year phase: it turns over in August and February
      if (p <= 0) return 'מינואר 2025';
      if (p % 2 === 1) return years((p + 1) / 2);                    // 1: a year, 3: two years, 5: three years ...
      return 'למעלה מ' + years(p / 2);  // 2: over a year, 4: over two years ...
    }
    window.aiYearsPhrase = aiYearsPhrase;
    var text = aiYearsPhrase(new Date());
    document.querySelectorAll('[data-ai-years]').forEach(function (el) { el.textContent = text; });
  })();
  /* ─── The stories: one shared stage, a row of cards to choose from, each story a timeline of scenes with captions, pause / restart / jump ───
     It starts when half of it is on screen, pauses when it leaves, loops; with reduced motion (the OS setting or the site's own accessibility panel) it does not move on its own: the viewer steps through the scenes. */
  (function () {
    var root = document.querySelector('[data-dv]');
    if (!root) return;
    var stage = root.querySelector('.dv-stage');
    var caption = root.querySelector('.dv-caption');
    var bar = root.querySelector('.dv-progress i');
    var dotsBox = root.querySelector('.dv-dots');
    var toggle = root.querySelector('[data-dv-toggle]');
    var nextBtn = root.querySelector('[data-dv-next]');
    var cards = root.querySelectorAll('[data-story-pick]');
    var storyEls = root.querySelectorAll('.dv-story');
    var descs = root.querySelectorAll('[data-story-desc]');
    var ORDER = ['book', 'fault', 'vehicle', 'event', 'vote', 'fan', 'distress', 'evac'];

    function lerp(pts, t, k) {
      if (t <= pts[0][0]) return pts[0][k];
      for (var i = 1; i < pts.length; i++) {
        if (t <= pts[i][0]) { var a = pts[i - 1], b = pts[i]; return a[k] + (b[k] - a[k]) * (t - a[0]) / (b[0] - a[0]); }
      }
      return pts[pts.length - 1][k];
    }
    var SUBJ = ['[קיבוץ הדגמה] 🚨 התראת מצוקה — דנה כהן', '[Demo Kibbutz] 🚨 Distress alert — Dana Cohen', '[Демо-кибуц] 🚨 Сигнал тревоги — Дана Коэн'];
    var FAN_PTS = [[11, 0, 0], [18, 74, 3], [25, 74, 3], [28.5, 96, 4]];      // [seconds, answered ok, need help]: 128 households

    var VOTE_PTS = [[17, 0, 0, 0], [23, 71, 18, 7], [24, 71, 18, 7], [27.5, 83, 21, 8]];      // [seconds, yes, no, abstain]: 140 eligible voters
    var EVAC_PTS = [[11, 0, 0], [18, 241, 38], [26, 241, 38], [28.5, 283, 21]];      // [seconds, arrived, on the way]: 312 residents
    var EV_TXT = [['הוראת פינוי', 'יש להתפנות לאולם הספורט'], ['Evacuation order', 'Please evacuate to the sports hall'], ['Приказ об эвакуации', 'Просим эвакуироваться в спортзал']];
    function setAll(attr, key, val) { root.querySelectorAll('[' + attr + '="' + key + '"]').forEach(function (el) { el.textContent = val; }); }

    function chip(sel, on, textOn, textOff, clsOn, clsOff) {
      root.querySelectorAll(sel).forEach(function (el) { el.textContent = on ? textOn : textOff; el.className = on ? clsOn : clsOff; });
    }

    var EVT_PTS = [[11, 0, 0], [18, 64, 9], [25, 64, 9], [28.5, 82, 12]];      // [seconds, coming, not coming]: 120 invited

    var DEFS = {
      vehicle: {
        total: 32,
        steps: [
          { at: 0, text: 'התושב מבקש את הרכב לשעות שהוא צריך.' },
          { at: 5, text: 'המנהל מאשר, והרכב שמור.', settle: 5 },
          { at: 11, text: 'סריקה אחת בתחילת הנסיעה.' },
          { at: 17, text: 'הנסיעה נרשמת, בלי מחברת בכניסה.' },
          { at: 23, text: 'כל הנסיעות במקום אחד: מי, מתי ולכמה זמן.' },
          { at: 28, text: 'רכב משותף, בלי מחברת נסיעות.' }
        ],
        frame: function (t) { chip('[data-vh="state"]', t >= 8.5, 'אושר', 'ממתין לאישור', 'st-ok', 'st-wait'); }
      },
      event: {
        total: 32,
        steps: [
          { at: 0, text: 'המנהל פותח אירוע ומזמין את היישוב.' },
          { at: 5, text: 'כל תושב מקבל הזמנה ועונה בלחיצה.' },
          { at: 11, text: 'רואים בזמן אמת כמה מגיעים.', settle: 6 },
          { at: 19, text: 'הרשימה מוכנה, בלי לרדוף אחרי אף אחד.' },
          { at: 25, text: 'תזכורת אוטומטית לפני האירוע.' },
          { at: 29, text: 'אירוע שכולם יודעים עליו.' }
        ],
        frame: function (t) {
          var y = Math.round(lerp(EVT_PTS, t, 1)), n = Math.round(lerp(EVT_PTS, t, 2)), pct = Math.round((y + n) / 120 * 100);
          setAll('data-ev', 'yes', y); setAll('data-ev', 'no', n); setAll('data-ev', 'wait', 120 - y - n); setAll('data-ev', 'pct', pct);
          root.querySelectorAll('[data-ev="bar"]').forEach(function (el) { el.style.width = pct + '%'; });
        }
      },
      book: {
        total: 32,
        steps: [
          { at: 0, text: 'התושב בוחר מתקן ושעה פנויה.' },
          { at: 5, text: 'בקשה אחת, בלחיצה אחת.' },
          { at: 11, text: 'המנהל רואה את הבקשה ומאשר.', settle: 5 },
          { at: 17, text: 'היומן מתעדכן מיד, לכולם.' },
          { at: 23, text: 'התושב מקבל אישור, ותזכורת לפני המועד.' },
          { at: 28, text: 'הזמנות בלי טלפונים ובלי בלגן.' }
        ],
        frame: function (t) { chip('[data-bk="state"]', t >= 14.5, 'אושר', 'ממתין לאישור', 'st-ok', 'st-wait'); }
      },
      fault: {
        total: 32,
        steps: [
          { at: 0, text: 'התושב מדווח על תקלה, עם תמונה.' },
          { at: 5, text: 'הקריאה מגיעה לטיפול מיד.' },
          { at: 11, text: 'הקריאה אצל המטפל, והוא לוקח אותה.', settle: 5 },
          { at: 17, text: 'מי שדיווח מקבל עדכון במייל.' },
          { at: 23, text: 'הקריאה נסגרת, והכול נשמר בהיסטוריה.' },
          { at: 28, text: 'תקלה לא נופלת בין הכיסאות.' }
        ],
        frame: function (t) { chip('[data-ft="state"]', t >= 14.5, 'בטיפול', 'חדשה', 'st-prog', ''); }
      },
      fan: {
        total: 32,
        steps: [
          { at: 0, text: 'המנהל פותח מניפה: בדיקת מצב לכל בתי היישוב.' },
          { at: 5, text: 'כל תושב מקבל הודעה ועונה בלחיצה אחת.' },
          { at: 11, text: 'התשובות נכנסות ללוח הבקרה בזמן אמת.', settle: 6 },
          { at: 19, text: 'מי שביקש עזרה בולט מיד, עם הכתובת.' },
          { at: 25, text: 'מי שלא ענה מקבל תזכורת, והתמונה מתמלאת.', settle: 3 },
          { at: 29, text: 'כל היישוב בתמונה אחת, בזמן אמת.' }
        ],
        frame: function (t) {
          var ok = Math.round(lerp(FAN_PTS, t, 1)), help = Math.round(lerp(FAN_PTS, t, 2));
          var vals = { ok: ok, help: help, wait: 128 - ok - help, pct: Math.round((ok + help) / 128 * 100) };
          Object.keys(vals).forEach(function (k) {
            root.querySelectorAll('[data-fx="' + k + '"]').forEach(function (el) { el.textContent = vals[k]; });
          });
          root.querySelectorAll('[data-fx="bar"]').forEach(function (el) { el.style.width = vals.pct + '%'; });
        }
      },
      vote: {
        total: 32,
        steps: [
          { at: 0, text: 'המנהל פותח הצבעה: תקציב 2026.' },
          { at: 5, text: 'כל מצביע מזדהה בקוד חד-פעמי.' },
          { at: 11, text: 'לוחצים ומצביעים. בהצבעה אנונימית הקול נספר בלי שם.' },
          { at: 17, text: 'התוצאות מתעדכנות בזמן אמת, בלי ספירה ידנית.', settle: 6 },
          { at: 24, text: 'ההצבעה נסגרת והתוצאה מוכנה מיד.', settle: 3.5 },
          { at: 29, text: 'הצבעה מסודרת, ותוצאה באותו רגע.' }
        ],
        frame: function (t) {
          var v = { yes: Math.round(lerp(VOTE_PTS, t, 1)), no: Math.round(lerp(VOTE_PTS, t, 2)), abs: Math.round(lerp(VOTE_PTS, t, 3)) };
          var sum = v.yes + v.no + v.abs;
          ['yes', 'no', 'abs'].forEach(function (k) {
            setAll('data-vx', k, v[k]);
            root.querySelectorAll('[data-vx-bar="' + k + '"]').forEach(function (el) { el.style.width = (sum ? v[k] / sum * 100 : 0) + '%'; });
          });
          setAll('data-vx', 'turn', sum);
        }
      },
      evac: {
        total: 32,
        steps: [
          { at: 0, text: 'המנהל מפעיל פינוי ובוחר יעד.' },
          { at: 5, text: 'ההוראה יוצאת בשפה של כל תושב.' },
          { at: 11, text: 'רואים בזמן אמת מי בטוח ומי עדיין בדרך.', settle: 6 },
          { at: 19, text: 'מי שלא ענה, בלי מייל או פגיע, מסומן לטיפול.' },
          { at: 25, text: 'שולחים הסעה, והפערים נסגרים.', settle: 3.5 },
          { at: 29, text: 'בפינוי, אף אחד לא נשכח.' }
        ],
        frame: function (t, scenes) {
          var safe = Math.round(lerp(EVAC_PTS, t, 1)), route = Math.round(lerp(EVAC_PTS, t, 2));
          setAll('data-ex', 'safe', safe); setAll('data-ex', 'route', route); setAll('data-ex', 'unk', 312 - safe - route);
          root.querySelectorAll('[data-ex="bar"]').forEach(function (el) { el.style.width = Math.round((safe + route) / 312 * 100) + '%'; });
          var sc = scenes[1];
          if (!sc || !sc.classList.contains('is-on')) return;
          var k = Math.max(0, Math.min(2, Math.floor((t - 6.5) / 1.8)));
          sc.querySelectorAll('.dv-langs span').forEach(function (c, j) { c.classList.toggle('on', j === k); });
          var ti = sc.querySelector('#dv-evtitle'), ms = sc.querySelector('#dv-evmsg');
          ti.textContent = EV_TXT[k][0]; ms.textContent = EV_TXT[k][1];
          ti.lang = ms.lang = ['he', 'en', 'ru'][k];
        }
      },
      distress: {
        total: 32,
        steps: [
          { at: 0, text: 'תושבת בקיבוץ לוחצת על כפתור המצוקה באפליקציה.' },
          { at: 5, text: 'ההתראה נשלחת מיד, עם המיקום שלה.' },
          { at: 10, text: 'הצוות מקבל הודעה בפעמון ובמייל, כל אחד בשפה שלו.' },
          { at: 17, text: 'כל ההתראות במקום אחד, עם הסטטוס של כל אחת.' },
          { at: 23, text: 'היא ביטלה? כל מי שקיבל את ההתראה מקבל עדכון מיד.' },
          { at: 28, text: 'כשיש אזעקה, כל שנייה קובעת.' }
        ],
        frame: function (t, scenes) {
          var sc = scenes[2];
          if (!sc || !sc.classList.contains('is-on')) return;
          var k = Math.min(2, Math.floor((t - 11.5) / 1.8));
          if (k < 0) k = 0;
          sc.querySelectorAll('.dv-langs span').forEach(function (c, j) { c.classList.toggle('on', j === k); });
          var subj = sc.querySelector('#dv-subj');
          subj.textContent = SUBJ[k];
          subj.dir = k === 0 ? 'rtl' : 'ltr';      // an English or Thai subject line reads left to right, whatever the page direction
        }
      }
    };

    var still = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-stop-motion'); };
    var story = 'book', def = DEFS.book, scenes = [], dots = [];
    var t = 0, cur = -1, playing = false, visible = false, timer = null, userStarted = false;      // userStarted: the viewer pressed play themselves, which is allowed even with reduced motion

    function cardTitle(id) { return root.querySelector('[data-story-pick="' + id + '"] b').textContent; }
    function show(i) {
      if (i === cur) return;
      cur = i;
      scenes.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      caption.textContent = def.steps[i].text;
    }
    function frame() {
      var i = 0;
      def.steps.forEach(function (s, k) { if (t >= s.at) i = k; });
      show(i);
      def.frame(t, scenes);
      bar.style.width = Math.min(100, t / def.total * 100) + '%';
    }
    function select(id) {
      scenes.forEach(function (s) { s.classList.remove('is-on'); });
      story = id; def = DEFS[id];
      var el = root.querySelector('.dv-story[data-story="' + id + '"]');
      storyEls.forEach(function (s) { s.classList.toggle('is-active', s === el); });
      scenes = Array.prototype.slice.call(el.querySelectorAll('.dv-scene'));
      cards.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-story-pick') === id ? 'true' : 'false'); });
      descs.forEach(function (d) { d.hidden = d.getAttribute('data-story-desc') !== id; });
      stage.setAttribute('aria-label', el.getAttribute('data-label'));
      dotsBox.textContent = '';
      dots = def.steps.map(function (s, k) {
        var b = document.createElement('button');
        b.type = 'button';
        var last = k === def.steps.length - 1;
        b.textContent = last ? '✓' : String(k + 1);
        b.setAttribute('aria-label', last ? 'סיום' : 'שלב ' + (k + 1));
        b.addEventListener('click', function () { jump(k); });
        dotsBox.appendChild(b);
        return b;
      });
      var nxt = ORDER[(ORDER.indexOf(id) + 1) % ORDER.length];
      nextBtn.textContent = 'התסריט הבא: ' + cardTitle(nxt) + ' ←';
      nextBtn.setAttribute('data-next', nxt);
      t = 0; cur = -1; frame();
      root.classList.toggle('dv-settle', !playing);      // paused: show the scene as it ends up, not frozen before its animations begin
    }
    var wasStill = still();
    function tick() {
      var s = still();
      if (s && !wasStill) userStarted = false;      // the viewer has just switched motion off (the site's accessibility panel): that wins over an earlier play
      wasStill = s;
      if (s && !userStarted) { setPlaying(false); return; }
      t += 0.1; if (t >= def.total) { t = 0; cur = -1; } frame(); }
    function setPlaying(on) {
      playing = on && (!still() || userStarted);
      root.classList.toggle('dv-paused', !playing);
      if (playing) root.classList.remove('dv-settle');
      toggle.textContent = playing ? '⏸' : '▶';
      toggle.setAttribute('aria-label', playing ? 'השהיה' : 'הפעלה');
      clearInterval(timer);
      if (playing) timer = setInterval(tick, 100);
    }
    function jump(i) {
      var s = def.steps[i];
      var hold = still() || !playing;
      t = s.at + (hold && s.settle ? s.settle : 0);      // stepping through by hand: show the scene settled, with its counters at their final values
      cur = -1; frame();
      root.classList.toggle('dv-settle', hold);
    }

    toggle.addEventListener('click', function () { if (!playing && still()) { userStarted = true; root.classList.remove('dv-still'); } setPlaying(!playing); });
    root.querySelector('[data-dv-restart]').addEventListener('click', function () { if (still()) { userStarted = true; root.classList.remove('dv-still'); } t = 0; cur = -1; frame(); setPlaying(true); });
    cards.forEach(function (c) { c.addEventListener('click', function () { select(c.getAttribute('data-story-pick')); }); });
    nextBtn.addEventListener('click', function () { select(nextBtn.getAttribute('data-next')); });
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !playing && !still()) setPlaying(true);
      else if (!visible && playing) setPlaying(false);
    }, { threshold: 0.5 }).observe(root);

    root.classList.toggle('dv-still', still());
    select('book');
    if (still()) { toggle.textContent = '▶'; root.classList.add('dv-paused'); }
  })();
})();
