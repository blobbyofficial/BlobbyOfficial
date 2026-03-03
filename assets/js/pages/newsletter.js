(() => {
  const cards = Array.from(document.querySelectorAll('.channel-card'));
  if (!cards.length) return;

  cards.forEach((card, index) => {
    window.setTimeout(() => {
      card.classList.add('is-live');
      window.setTimeout(() => card.classList.remove('is-live'), 450);
    }, 130 + (index * 80));
  });
})();
