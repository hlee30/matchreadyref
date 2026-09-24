/* Match Ready Ref — GA4. Enter this site's own web-stream Measurement ID below. */
(() => {
  'use strict';
  const MEASUREMENT_ID = 'G-3RDDMX0KZW';
  const enabled = /^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID);
  window.mrrTrack = (eventName, parameters = {}) => {
    if (enabled && typeof window.gtag === 'function') {
      window.gtag('event', eventName, parameters);
    }
  };
  if (!enabled) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID);
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(tag);
})();
