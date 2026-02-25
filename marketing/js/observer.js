/**
 * LingoFlow LP IntersectionObserver
 *
 * Drives [data-animate] scroll-reveal animations and
 * section_view analytics events.
 *
 * Graceful degradation: if IntersectionObserver is unavailable
 * or JS is disabled, content is visible via CSS fallback (.no-js).
 */
(function () {
  'use strict';

  // Mark document as JS-enabled for CSS fallback
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window)) {
    var allAnimated = document.querySelectorAll('[data-animate]');
    for (var i = 0; i < allAnimated.length; i++) {
      allAnimated[i].classList.add('is-visible');
    }
    return;
  }

  // ── Animation observer ──
  var animateObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        animateObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  // Assign stagger index to children
  var staggerContainers = document.querySelectorAll('[data-animate-stagger]');
  staggerContainers.forEach(function (container) {
    var children = container.querySelectorAll('[data-animate]');
    children.forEach(function (child, index) {
      child.style.setProperty('--stagger-index', index);
    });
  });

  // Observe all [data-animate] elements
  var animateElements = document.querySelectorAll('[data-animate]');
  animateElements.forEach(function (el) {
    if (prefersReducedMotion) {
      el.classList.add('is-visible');
    } else {
      animateObserver.observe(el);
    }
  });

  // ── Section view analytics observer ──
  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && window.__lpAnalytics) {
        var sectionId = entry.target.getAttribute('data-section');
        if (sectionId) {
          window.__lpAnalytics.sectionView(sectionId);
          sectionObserver.unobserve(entry.target);
        }
      }
    });
  }, {
    threshold: 0.3
  });

  var sections = document.querySelectorAll('[data-section]');
  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  // ── Mobile menu toggle ──
  var toggle = document.querySelector('.lp-nav-toggle');
  var mobileMenu = document.getElementById('lp-mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // ── Language Switcher ──
  var LANG_KEY = 'lf_lang';
  var LANG_SESSION = 'lf_lang_redirected';
  var LANG_LABELS = { en: 'EN', ja: '日本語', 'zh-hans': '简体中文' };
  // Canonical lang codes stored in lf_lang: "en" | "ja" | "zh-Hans"
  var LANG_CANONICAL = { en: 'en', ja: 'ja', 'zh-hans': 'zh-Hans' };
  function normalizeLang(lang) {
    if (!lang) return lang;
    return LANG_CANONICAL[String(lang).toLowerCase()] || lang;
  }
  var currentLang = document.documentElement.lang;

  function getLangAlternates() {
    var links = document.querySelectorAll('link[rel="alternate"][hreflang]');
    var map = {};
    for (var i = 0; i < links.length; i++) {
      var h = links[i].getAttribute('hreflang');
      if (h && h.toLowerCase() !== 'x-default') {
        map[h.toLowerCase()] = links[i].href;
      }
    }
    return map;
  }

  var alternates = getLangAlternates();

  // Fallback: if no hreflang alternates, derive URLs from path
  if (Object.keys(alternates).length === 0) {
    var parts = location.pathname.split('/').filter(Boolean);
    // Strip explicit language prefixes
    if (parts[0] === 'en' || parts[0] === 'ja' || parts[0] === 'zh-hans') parts.shift();
    // Drop meeting-translation child suffix like "ja-en" / "ja-zh"
    if (parts.length && /^ja-(en|zh)$/i.test(parts[parts.length - 1])) parts.pop();
    var slug = parts.join('/').replace(/^\/+|\/+$/g, '');
    // Insurance: prevent accidental double prefix
    if (slug.startsWith('ja/')) slug = slug.replace(/^ja\//, '');
    if (slug.startsWith('zh-hans/')) slug = slug.replace(/^zh-hans\//, '');
    if (slug.startsWith('en/')) slug = slug.replace(/^en\//, '');
    alternates['en'] = slug ? '/' + slug : '/';
    alternates['ja'] = slug ? '/ja/' + slug : '/ja';
    alternates['zh-hans'] = slug ? '/zh-hans/' + slug : '/zh-hans';
  }

  function initSwitcherUI() {
    // Update desktop button label to current language
    var langCurrent = document.querySelector('.lp-lang-current');
    if (langCurrent) {
      langCurrent.textContent = LANG_LABELS[currentLang.toLowerCase()] || currentLang.toUpperCase();
    }

    // Mark active option and set hrefs
    var allOptions = document.querySelectorAll('.lp-lang-option, .lp-lang-option-mobile');
    for (var i = 0; i < allOptions.length; i++) {
      var opt = allOptions[i];
      var lang = opt.getAttribute('data-lang');
      if (!lang) continue;

      if (lang.toLowerCase() === currentLang.toLowerCase()) {
        opt.classList.add('is-active');
        opt.setAttribute('aria-selected', 'true');
      }

      if (alternates[lang.toLowerCase()]) {
        opt.href = alternates[lang.toLowerCase()];
      } else if (lang.toLowerCase() === currentLang.toLowerCase()) {
        opt.href = window.location.href;
      }
    }

    // Desktop dropdown toggle
    var langBtn = document.querySelector('.lp-lang-btn');
    if (langBtn) {
      var dropdown = langBtn.parentElement.querySelector('.lp-lang-dropdown');

      langBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.toggle('is-open');
        langBtn.setAttribute('aria-expanded', String(isOpen));
      });

      document.addEventListener('click', function () {
        dropdown.classList.remove('is-open');
        langBtn.setAttribute('aria-expanded', 'false');
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          dropdown.classList.remove('is-open');
          langBtn.setAttribute('aria-expanded', 'false');
          langBtn.focus();
        }
      });
    }
  }

  // Handle language option clicks (delegated)
  document.addEventListener('click', function (e) {
    var opt = e.target.closest('.lp-lang-option, .lp-lang-option-mobile');
    if (!opt) return;

    var lang = opt.getAttribute('data-lang');
    if (!lang) return;

    // Save preference
    try {
      localStorage.setItem(LANG_KEY, normalizeLang(lang));
      sessionStorage.removeItem(LANG_SESSION);
    } catch (ex) { /* private browsing */ }

    // Analytics event
    if (window.__lpAnalytics && window.__lpAnalytics.pushEvent) {
      window.__lpAnalytics.pushEvent('lang_switch', 'engagement', 'click', lang);
    }

    // Same language — just close dropdown
    if (lang.toLowerCase() === currentLang.toLowerCase()) {
      e.preventDefault();
      var dd = document.querySelector('.lp-lang-dropdown');
      if (dd) dd.classList.remove('is-open');
      return;
    }

    // No alternate page — save pref only
    if (!alternates[lang.toLowerCase()]) {
      e.preventDefault();
      var cur = document.querySelector('.lp-lang-current');
      if (cur) cur.textContent = LANG_LABELS[lang.toLowerCase()] || lang.toUpperCase();
      var dd2 = document.querySelector('.lp-lang-dropdown');
      if (dd2) dd2.classList.remove('is-open');
      return;
    }

    // Alternate exists — let the <a href> navigate naturally
  });

  initSwitcherUI();
})();
