(async () => {
  const mount = document.querySelector('[data-portfolio]');
  if (!mount) return;
  const data = await fetch('/content/portfolio/profile.json').then((r) => r.json()).catch(() => null);
  if (!data) return;

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
  mount.innerHTML = `
    <section class="page-section">
      <h2>YouTube</h2>
      <p><a href="${data.youtube}" target="_blank" rel="noopener noreferrer">${data.youtube}</a></p>
      <iframe title="YouTube" src="${data.youtubeEmbed}" style="width:100%;height:360px;border:1px solid var(--line);border-radius:14px;" loading="lazy"></iframe>
    </section>
    <section class="page-section" style="margin-top:1rem;">
      <h2>TikTok</h2>
      <p><a href="${data.tiktok}" target="_blank" rel="noopener noreferrer">${data.tiktok}</a></p>
      <p class="page-meta">${data.tiktokEmbedPlaceholder}</p>
    </section>
    <section class="page-section" style="margin-top:1rem;">
      <h2>Selected Work</h2>
      <div class="carousel">${(data.gallery || []).map((g) => g.type === 'video' ? `<iframe title="${g.title}" src="${g.src}" style="width:100%;height:220px;border:1px solid var(--line);border-radius:14px;" loading="lazy"></iframe>` : `<img src="${g.src}" alt="${g.title}" loading="lazy">`).join('')}</div>
    </section>
    <section class="page-section" style="margin-top:1rem;">
      <h2>Client Reviews</h2>
      <div class="grid-cards">${(data.reviews || []).map((r) => `<article class="review"><p class="stars">${stars(r.rating)} <span class="page-meta">(${r.rating}/5)</span></p><p>${r.text}</p><p class="page-meta">— ${r.author}</p></article>`).join('')}</div>
    </section>
  `;
})();
