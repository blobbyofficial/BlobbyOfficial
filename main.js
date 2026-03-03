/*
 * Legacy compatibility entrypoint.
 * Keeps older references to /main.js working while the home page logic
 * now lives in /assets/js/pages/home.js.
 */
(() => {
  import('/assets/js/pages/home.js').catch(() => {
    // Silent fail: keeps static pages resilient even if module loading is unavailable.
  });
})();
