(() => {
  const list = document.querySelector('[data-store-list]');
  const featured = document.querySelector('[data-store-featured]');
  const search = document.querySelector('[data-store-search]');
  const filter = document.querySelector('[data-store-filter]');
  const sort = document.querySelector('[data-store-sort]');
  const chips = document.querySelector('[data-store-filter-chips]');
  const faq = document.querySelector('[data-store-faq]');
  if (!list || !featured) return;

  const esc = (v) => String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const safeUrl = (url) => {
    const value = String(url || '').trim();
    if (value.startsWith('/') || value.startsWith('https://') || value.startsWith('http://') || value.startsWith('mailto:')) return value;
    return '#';
  };
  const toNumber = (raw) => Number(String(raw || '').replace(/[^0-9.]/g, '')) || 0;
  const parseDate = (raw) => new Date(raw || 0).getTime() || 0;

  const getParams = () => new URLSearchParams(window.location.search);
  const setParams = (q, category, sortMode) => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (category && category !== 'All') next.set('category', category);
    if (sortMode && sortMode !== 'featured') next.set('sort', sortMode);
    const query = next.toString();
    const target = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState({}, '', target);
  };

  const loadParams = () => {
    const params = getParams();
    if (search) search.value = params.get('q') || '';
    if (sort && params.get('sort')) sort.value = params.get('sort');
    return params.get('category') || 'All';
  };

  let products = [];

  const featuredItems = (items) => items.filter((item) => item.featured || item.bestseller).slice(0, 2);

  const renderFeatured = (items) => {
    const picks = featuredItems(items);
    featured.innerHTML = picks.length ? picks.map((p) => `
      <article class="featured-card reveal-on-load">
        <img src="${esc(p.thumbnail)}" alt="${esc(p.title)}" loading="lazy">
        <div class="badge-row">
          ${p.bestseller ? '<span class="badge">Bestseller</span>' : ''}
          ${p.featured ? '<span class="badge">Featured</span>' : ''}
          <span class="badge">${esc(p.category)}</span>
        </div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.shortPitch || p.description || '')}</p>
        <div class="price-row"><span class="price-current">${esc(p.salePrice || p.price || '')}</span>${p.originalPrice ? `<span class="price-old">${esc(p.originalPrice)}</span>` : ''}</div>
        <a class="button button-secondary" href="/store/product/?id=${encodeURIComponent(p.id)}">View product</a>
      </article>
    `).join('') : '<article class="state-card">Featured products will appear here.</article>';
  };

  const renderFaq = (items) => {
    const source = items.find((item) => Array.isArray(item.faq) && item.faq.length)?.faq || [];
    faq.innerHTML = `<h2>Purchase confidence</h2><div class="faq-grid">${source.slice(0, 4).map((row) => `<details class="product-faq"><summary>${esc(row.q || '')}</summary><p>${esc(row.a || '')}</p></details>`).join('')}</div>`;
  };

  const renderChips = (q, category) => {
    const active = [];
    if (q) active.push({ label: `Search: ${q}`, key: 'q' });
    if (category && category !== 'All') active.push({ label: `Category: ${category}`, key: 'category' });

    if (!chips) return;
    chips.hidden = !active.length;
    chips.innerHTML = active.map((item) => `<span class="filter-chip">${esc(item.label)} <button type="button" data-clear="${esc(item.key)}" aria-label="Clear ${esc(item.key)}">×</button></span>`).join('') + (active.length ? '<span class="filter-chip"><button type="button" data-clear="all">Clear all</button></span>' : '');

    chips.querySelectorAll('[data-clear]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.getAttribute('data-clear');
        if (key === 'q' && search) search.value = '';
        if (key === 'category' && filter) filter.value = 'All';
        if (key === 'all') {
          if (search) search.value = '';
          if (filter) filter.value = 'All';
          if (sort) sort.value = 'featured';
        }
        apply();
      });
    });
  };

  const renderGrid = (items) => {
    if (!items.length) {
      list.innerHTML = '<article class="state-card">No products matched your filters. Try a different category or keyword.</article>';
      return;
    }

    list.innerHTML = items.map((p, index) => `
      <article class="store-card reveal-on-load" style="animation-delay:${Math.min(index * 35, 260)}ms">
        <img src="${esc(p.thumbnail)}" alt="${esc(p.title)}" loading="lazy" ${index === 0 ? 'fetchpriority="high"' : ''}>
        <div class="badge-row">
          ${p.bestseller ? '<span class="badge">Bestseller</span>' : ''}
          ${p.featured ? '<span class="badge">Featured</span>' : ''}
          <span class="badge">${esc(p.category)}</span>
          <span class="badge">${esc(p.format)}</span>
        </div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.shortPitch || p.description || '')}</p>
        <div class="price-row"><span class="price-current">${esc(p.salePrice || p.price || '')}</span>${p.originalPrice ? `<span class="price-old">${esc(p.originalPrice)}</span>` : ''}</div>
        <p class="page-meta">${esc((p.highlights || []).slice(0, 2).join(' • '))}</p>
        <a class="button button-secondary" href="/store/product/?id=${encodeURIComponent(p.id)}">View product</a>
      </article>
    `).join('');
  };

  const apply = () => {
    const q = (search?.value || '').trim().toLowerCase();
    const category = filter?.value || 'All';
    const sortMode = sort?.value || 'featured';

    let result = products.filter((item) => {
      if (category !== 'All' && item.category !== category) return false;
      if (!q) return true;
      return [item.title, item.description, item.shortPitch, item.category, item.format, ...(item.tags || []), ...(item.highlights || [])].join(' ').toLowerCase().includes(q);
    });

    result.sort((a, b) => {
      if (sortMode === 'newest') return parseDate(b.dateAdded) - parseDate(a.dateAdded);
      if (sortMode === 'price-low') return toNumber(a.salePrice || a.price) - toNumber(b.salePrice || b.price);
      if (sortMode === 'price-high') return toNumber(b.salePrice || b.price) - toNumber(a.salePrice || a.price);
      return Number(Boolean(b.featured || b.bestseller)) - Number(Boolean(a.featured || a.bestseller));
    });

    renderChips(q, category);
    renderGrid(result);
    setParams(q, category, sortMode);
  };

  const load = async () => {
    list.innerHTML = '<article class="state-card">Loading preset catalog…</article>';
    const raw = await fetch('/content/store/products.json').then((r) => r.json()).catch(() => null);
    const source = Array.isArray(raw) ? raw : (raw?.products || []);

    products = source.filter((item) => item && item.id && item.title && item.thumbnail).map((item) => ({
      ...item,
      gumroadUrl: safeUrl(item.gumroadUrl)
    }));

    const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];
    if (filter) filter.innerHTML = categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');

    const categoryFromParams = loadParams();
    if (filter) filter.value = categories.includes(categoryFromParams) ? categoryFromParams : 'All';

    renderFeatured(products);
    renderFaq(products);
    apply();
  };

  search?.addEventListener('input', apply);
  filter?.addEventListener('change', apply);
  sort?.addEventListener('change', apply);
  load();
})();
