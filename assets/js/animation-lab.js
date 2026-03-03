(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const letterTargets = Array.from(document.querySelectorAll('.hero-copy h1, .section-heading h2, .hero-card h2, .store-featured__copy h3'));

  function splitLetters(el) {
    if (!el || el.dataset.lettersReady === 'true') return;

    const text = (el.textContent || '').trim();
    const words = text.split(/\s+/).filter(Boolean);
    const frag = document.createDocumentFragment();
    let letterIndex = 0;

    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'motion-word';

      [...word].forEach((char) => {
        const span = document.createElement('span');
        span.className = 'motion-letter';
        span.textContent = char;
        span.style.setProperty('--letter-index', String(letterIndex));
        span.style.setProperty('--letter-drift', `${(Math.random() * 1.1 - 0.55).toFixed(2)}deg`);
        span.style.setProperty('--letter-duration', `${(6.2 + Math.random() * 4.5).toFixed(2)}s`);
        span.style.setProperty('--letter-delay', `${(Math.random() * 1.4).toFixed(2)}s`);
        wordSpan.appendChild(span);
        letterIndex += 1;
      });

      frag.appendChild(wordSpan);
      if (wordIndex < words.length - 1) {
        frag.appendChild(document.createTextNode(' '));
      }
    });

    el.textContent = '';
    el.appendChild(frag);
    el.dataset.lettersReady = 'true';
  }

  letterTargets.forEach(splitLetters);

  const cards = Array.from(document.querySelectorAll('.hero-card, .feature-card, .project-card, .store-featured, .store-card, .process-card, .connect-card, .cta-panel'));
  cards.forEach((card, i) => {
    card.style.setProperty('--float-delay', `${(i % 7) * 0.26}s`);
    card.style.setProperty('--float-duration', `${(8.5 + (i % 5) * 0.7).toFixed(2)}s`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-in-view');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('[data-reveal], .hero-card, .section-heading').forEach((el) => observer.observe(el));

  const root = document.documentElement;
  let mx = 50;
  let my = 20;
  let tx = 50;
  let ty = 20;

  function animatePointer() {
    tx += (mx - tx) * 0.04;
    ty += (my - ty) * 0.04;
    root.style.setProperty('--ambient-x', `${tx}%`);
    root.style.setProperty('--ambient-y', `${ty}%`);
    requestAnimationFrame(animatePointer);
  }

  window.addEventListener('pointermove', (e) => {
    mx = (e.clientX / window.innerWidth) * 100;
    my = (e.clientY / window.innerHeight) * 100;
  }, { passive: true });

  animatePointer();
})();
