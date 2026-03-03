(async () => {
  const list = document.querySelector('[data-store-list]');
  const search = document.querySelector('[data-store-search]');
  const filter = document.querySelector('[data-store-filter]');
  if (!list) return;

  const products = await fetch('/content/store/products.json').then((r) => r.json()).catch(() => []);
  const categories = ['All', ...new Set(products.map((p) => p.category))];
  if (filter) filter.innerHTML = categories.map((c) => `<option value="${c}">${c}</option>`).join('');

  function render(items) {
    list.innerHTML = items.map((p) => `
      <article class="card">
        <img src="${p.thumbnail}" alt="${p.title}" loading="lazy">
        <div class="tag-row"><span class="tag">${p.category}</span><span class="tag">${p.format}</span></div>
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <p><strong>${p.price}</strong></p>
        <a class="button button-secondary" href="/store/product/?id=${encodeURIComponent(p.id)}">View product</a>
      </article>
    `).join('');
  }

  function apply() {
    const q = (search?.value || '').toLowerCase();
    const c = filter?.value || 'All';
    render(products.filter((p) => (c === 'All' || p.category === c) && [p.title, p.description, p.category, p.format].join(' ').toLowerCase().includes(q)));
  }

  render(products);
  search?.addEventListener('input', apply);
  filter?.addEventListener('change', apply);
})();
