(() => {
  const checks = Array.from(document.querySelectorAll('[data-agree]'));
  const button = document.querySelector('[data-open-commission]');
  const modal = document.querySelector('[data-commission-modal]');
  const close = document.querySelector('[data-close-modal]');
  const backdrop = document.querySelector('[data-modal-backdrop]');
  if (!button || !checks.length || !modal) return;

  const refresh = () => {
    button.disabled = !checks.every((c) => c.checked);
  };
  checks.forEach((c) => c.addEventListener('change', refresh));
  refresh();

  button.addEventListener('click', () => { modal.hidden = false; });
  close?.addEventListener('click', () => (modal.hidden = true));
  backdrop?.addEventListener('click', () => (modal.hidden = true));
})();
