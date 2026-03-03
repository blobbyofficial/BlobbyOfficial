(() => {
  const mount = document.querySelector('[data-product-page]');
  if (!mount) return;

  const esc = (v) => String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const safeUrl = (url) => {
    const value = String(url || '').trim();
    if (value.startsWith('/') || value.startsWith('https://') || value.startsWith('http://') || value.startsWith('mailto:')) return value;
    return '#';
  };

  const notFound = () => {
    mount.innerHTML = '<section class="page-section state-card"><h1>Product not found</h1><p class="page-meta">The requested preset may have been removed or renamed.</p><a class="button button-secondary" href="/store/">Back to store</a></section>';
  };

  const render = (p, allProducts) => {
    const gallery = Array.isArray(p.gallery) ? p.gallery : [];
    const media = gallery.length ? gallery : [p.thumbnail].filter(Boolean);
    const recommendations = allProducts.filter((item) => item.id !== p.id).slice(0, 3);

    mount.innerHTML = `
      <section class="page-hero pdp-header reveal-on-load">
        <p class="page-meta">${esc(p.category || '')} · ${esc(p.format || '')}</p>
        <h1>${esc(p.title)}</h1>
        <p>${esc(p.description || '')}</p>
        <div class="badge-row">${(p.tags || []).map((tag) => `<span class="badge">${esc(tag)}</span>`).join('')}</div>
      </section>

      <section class="product-layout reveal-on-load reveal-delay-1">
        <article class="product-media">
          <img class="product-primary-media" data-primary-media src="${esc(media[0])}" alt="${esc(p.title)}" fetchpriority="high">
          <div class="thumb-row">${media.map((src, index) => `<button type="button" class="${index === 0 ? 'is-active' : ''}" data-thumb-src="${esc(src)}"><img src="${esc(src)}" alt="${esc(p.title)} thumbnail ${index + 1}" loading="lazy"></button>`).join('')}</div>
        </article>

        <aside class="product-buy">
          <div class="price-row"><span class="price-current">${esc(p.salePrice || p.price || '')}</span>${p.originalPrice ? `<span class="price-old">${esc(p.originalPrice)}</span>` : ''}</div>
          <div class="page-actions">
            <a class="button button-primary" href="${esc(safeUrl(p.gumroadUrl))}" target="_blank" rel="noopener noreferrer">Buy on Gumroad</a>
            <a class="button button-secondary" href="/store/">Back to store</a>
          </div>
          <div class="buy-trust">
            <span>⚡ Instant digital delivery</span>
            <span>🛡️ Transparent refund/revision policy</span>
            <span>🎬 Optimized for DaVinci Resolve creators</span>
            <span><a href="/legal/payments/">Payment policy</a> · <a href="/legal/revisions/">Revision policy</a> · <a href="/legal/terms/">Terms</a></span>
          </div>
        </aside>
      </section>

      <section class="page-section product-detail reveal-on-load reveal-delay-1">
        <h2>What's included</h2>
        <div class="includes-grid">${(p.includes || p.features || []).map((row) => `<div class="include-item">${esc(row)}</div>`).join('')}</div>
      </section>

      <section class="page-section product-detail reveal-on-load reveal-delay-2">
        <h2>Outcomes</h2>
        <ul>${(p.highlights || []).map((row) => `<li>${esc(row)}</li>`).join('')}</ul>
      </section>

      <section class="page-section product-detail reveal-on-load reveal-delay-2">
        <h2>FAQ</h2>
        <div class="faq-grid">${(p.faq || []).map((row) => `<details class="product-faq"><summary>${esc(row.q || '')}</summary><p>${esc(row.a || '')}</p></details>`).join('')}</div>
      </section>

      <section class="page-section reveal-on-load reveal-delay-2">
        <h2>You may also like</h2>
        <div class="reco-grid">${recommendations.map((item) => `<article class="reco-card"><img src="${esc(item.thumbnail)}" alt="${esc(item.title)}" loading="lazy"><h3>${esc(item.title)}</h3><p class="page-meta">${esc(item.salePrice || item.price || '')}</p><a class="button button-secondary" href="/store/product/?id=${encodeURIComponent(item.id)}">View product</a></article>`).join('')}</div>
      </section>
    `;

    const primary = mount.querySelector('[data-primary-media]');
    mount.querySelectorAll('[data-thumb-src]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!primary) return;
        primary.src = button.getAttribute('data-thumb-src') || primary.src;
        mount.querySelectorAll('[data-thumb-src]').forEach((node) => node.classList.remove('is-active'));
        button.classList.add('is-active');
      });
    });
  };

  const load = async () => {
    mount.innerHTML = '<section class="page-section state-card">Loading product details…</section>';
    const id = new URLSearchParams(location.search).get('id');
    if (!id) {
      notFound();
      return;
    }

    const raw = await fetch('/content/store/products.json').then((r) => r.json()).catch(() => null);
    const products = Array.isArray(raw) ? raw : (raw?.products || []);
    const product = products.find((item) => item.id === id);

    if (!product) {
      notFound();
      return;
    }

    render(product, products);
  };

  load();
})();
