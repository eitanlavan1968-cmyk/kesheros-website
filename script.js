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

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          counterObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll('[data-count]').forEach((el) => counterObserver.observe(el));

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
      })
    );
  }

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

  /* ─── Dark / light theme toggle ─── */
  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    // Restore saved theme
    var saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);

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

  /* ─── Smooth scroll for anchor links ─── */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();
