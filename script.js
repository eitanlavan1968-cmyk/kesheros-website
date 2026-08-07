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
    // Hide all messages initially
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
              // Auto-scroll chat container
              m.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, delay);
            delay += 400;
          } else {
            // User message — just appear
            setTimeout(function () {
              m.classList.remove('chat-hidden');
              m.classList.add('chat-appear');
              m.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
})();
