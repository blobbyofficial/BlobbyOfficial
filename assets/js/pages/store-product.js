(async () => {
  const mount = document.querySelector('[data-product-page]');
  if (!mount) return;

  const id = new URLSearchParams(location.search).get('id');
  const products = await fetch('/content/store/products.json').then((r) => r.json()).catch(() => []);
  const p = products.find((x) => x.id === id);
  if (!p) { mount.innerHTML = '<p>Product not found.</p>'; return; }

  mount.innerHTML = `
    <section class="page-hero">
      <p class="page-meta">${p.category} · ${p.format}</p>
      <h1>${p.title}</h1>
      <p>${p.description}</p>
      <p><strong>${p.price}</strong></p>
      <div class="page-actions">
        <a class="button button-primary" href="${p.gumroadUrl}" target="_blank" rel="noopener noreferrer">Open on Gumroad</a>
        <a class="button button-secondary" href="/store/">Back to store</a>
      </div>
    </section>
    <section class="page-section" style="margin-top:1rem;">
      <h2>Features</h2>
      <ul>${(p.features || []).map((f) => `<li>${f}</li>`).join('')}</ul>
      <div class="carousel" style="margin-top:.9rem;">${(p.gallery || []).map((src) => `<img src="${src}" alt="${p.title}" loading="lazy">`).join('')}</div>
    </section>
  `;
})();
