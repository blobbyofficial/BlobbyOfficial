(async () => {
  const list = document.querySelector('[data-blog-list]');
  const search = document.querySelector('[data-blog-search]');
  if (!list) return;

  const posts = await fetch('/content/blog/index.json').then((r) => r.json()).catch(() => []);

  function render(items) {
    list.innerHTML = items.map((p) => `
      <article class="card">
        <img src="${p.cover}" alt="${p.title}" loading="lazy">
        <p class="page-meta">${p.date}</p>
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
        <div class="tag-row">${p.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        <a class="button button-secondary" href="/blog/post/?slug=${encodeURIComponent(p.slug)}">Read post</a>
      </article>
    `).join('');
  }

  render(posts);
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    render(posts.filter((p) => [p.title, p.excerpt, ...(p.tags || [])].join(' ').toLowerCase().includes(q)));
  });
})();
