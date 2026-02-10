/**
 * LingoFlow LP Analytics Stub
 *
 * Pushes events to window.dataLayer for future GTM integration.
 * Logs to console in dev mode (localhost or ?debug=1).
 *
 * No external dependencies. No cookies set.
 * All content is in the DOM — JS-disabled users see full content.
 */
(function () {
  'use strict';

  var DEV_MODE = (
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    new URLSearchParams(location.search).has('debug')
  );

  window.dataLayer = window.dataLayer || [];

  function pushEvent(event, category, action, label, value, opts) {
    var payload = {
      event: event,
      eventCategory: category || '',
      eventAction: action || '',
      eventLabel: label || '',
      eventValue: value || undefined,
      timestamp: new Date().toISOString(),
      page: location.pathname
    };

    window.dataLayer.push(payload);

    // GA4 へ直接送信（gtag が読み込まれている場合）
    if (typeof window.gtag === 'function') {
      var gtagParams = {
        event_category: category || undefined,
        event_label: label || undefined,
        value: value || undefined,
        page_location: location.href,
        page_path: location.pathname
      };
      if (opts) {
        for (var k in opts) {
          if (opts.hasOwnProperty(k)) gtagParams[k] = opts[k];
        }
      }
      window.gtag('event', event, gtagParams);
    }

    if (DEV_MODE) {
      console.log('[LP Analytics]', event, payload);
    }
  }

  // page_view: fired on load
  pushEvent('page_view', 'navigation', 'page_load', document.title);

  // cta_click: delegated click handler (beacon + fallback for navigation links)
  document.addEventListener('click', function (e) {
    var target = e.target.closest('[data-analytics="cta_click"]');
    if (!target) return;
    var label = target.getAttribute('data-analytics-label') || target.textContent.trim();

    var anchor = target.closest('a[href]');
    var href = anchor ? anchor.href : '';           // DOM property = 絶対URL
    var opensNewTab = anchor && anchor.target === '_blank';
    var isMailto = href.indexOf('mailto:') === 0;
    var isModified = e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1;

    // target="_blank" / mailto: / 非リンク / Ctrl·Meta·中クリック → race なし
    if (!anchor || opensNewTab || isMailto || isModified) {
      pushEvent('cta_click', 'engagement', 'click', label, undefined, {
        transport_type: 'beacon',
        cta_id: label,
        link_url: href || undefined
      });
      return;
    }

    // 通常の遷移リンク → preventDefault + beacon + event_callback + fallback
    e.preventDefault();
    var navigated = false;

    function navigate() {
      if (navigated) return;
      navigated = true;
      location.href = href;
    }

    pushEvent('cta_click', 'engagement', 'click', label, undefined, {
      transport_type: 'beacon',
      event_callback: navigate,
      cta_id: label,
      link_url: href
    });

    setTimeout(navigate, 250);
  });

  // Public API for observer.js
  window.__lpAnalytics = {
    pushEvent: pushEvent,
    sectionView: function (sectionId) {
      pushEvent('section_view', 'engagement', 'scroll', sectionId);
    },
    demoView: function () {
      pushEvent('demo_view', 'engagement', 'view', 'demo-section');
    },
    tryStart: function (productSlug) {
      pushEvent('try_start', 'conversion', 'click', productSlug);
    }
  };
})();
