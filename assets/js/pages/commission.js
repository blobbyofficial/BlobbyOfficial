(() => {
  const checks = Array.from(document.querySelectorAll('[data-agree]'));
  const button = document.querySelector('[data-open-commission]');
  const count = document.querySelector('[data-agreement-count]');
  const modal = document.querySelector('[data-commission-modal]');
  const close = document.querySelector('[data-close-modal]');
  const backdrop = document.querySelector('[data-modal-backdrop]');
  if (!button || !checks.length || !modal) return;

  let returnFocusTo = null;

  const checkedCount = () => checks.filter((item) => item.checked).length;

  const refresh = () => {
    const complete = checkedCount();
    const ready = complete === checks.length;
    button.disabled = !ready;
    if (count) count.textContent = String(complete);

    if (ready && !button.classList.contains('button-ready')) {
      button.classList.add('button-ready');
      window.setTimeout(() => button.classList.remove('button-ready'), 700);
    }
  };

  const openModal = () => {
    returnFocusTo = document.activeElement;
    modal.hidden = false;
    modal.classList.remove('modal--closing');
    modal.classList.add('modal--active');
    close?.focus();
  };

  const closeModal = () => {
    modal.classList.remove('modal--active');
    modal.classList.add('modal--closing');

    window.setTimeout(() => {
      modal.hidden = true;
      modal.classList.remove('modal--closing');
      if (returnFocusTo instanceof HTMLElement) returnFocusTo.focus();
    }, 180);
  };

  checks.forEach((c) => c.addEventListener('change', refresh));
  refresh();

  button.addEventListener('click', openModal);
  close?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) {
      closeModal();
    }
  });
})();
