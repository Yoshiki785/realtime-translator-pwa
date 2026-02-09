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
})();
