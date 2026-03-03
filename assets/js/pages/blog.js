(() => {
  const list = document.querySelector('[data-blog-list]');
  const search = document.querySelector('[data-blog-search]');
  const sort = document.querySelector('[data-blog-sort]');
  const topicsRoot = document.querySelector('[data-topic-filter]');
  const statsRoot = document.querySelector('[data-blog-stats]');
  if (!list) return;

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const parseDate = (value) => new Date(value || 0).getTime() || 0;
  let allPosts = [];
  let activeTopic = 'all';

  const updateStats = (posts) => {
    if (!statsRoot) return;
    const tags = new Set(posts.flatMap((post) => post.tags || []));
    statsRoot.innerHTML = `<span>${posts.length} posts</span><span>${tags.size} topics</span><span>Updated weekly</span>`;
  };

  const renderTopics = (posts) => {
    if (!topicsRoot) return;
    const tags = [...new Set(posts.flatMap((post) => post.tags || []))].sort((a, b) => a.localeCompare(b));
    const pills = ['all', ...tags];
    topicsRoot.innerHTML = pills.map((tag) => {
      const selected = tag === activeTopic ? 'active' : '';
      const label = tag === 'all' ? 'All topics' : tag;
      return `<button type="button" class="topic-pill ${selected}" data-topic="${escapeHtml(tag)}">${escapeHtml(label)}</button>`;
    }).join('');

    topicsRoot.querySelectorAll('[data-topic]').forEach((button) => {
      button.addEventListener('click', () => {
        activeTopic = button.getAttribute('data-topic') || 'all';
        renderTopics(allPosts);
        renderPosts();
      });
    });
  };

  const renderPosts = () => {
    const query = search?.value.trim().toLowerCase() || '';
    const mode = sort?.value || 'newest';

    let filtered = allPosts.filter((post) => {
      if (activeTopic !== 'all' && !(post.tags || []).includes(activeTopic)) return false;
      if (!query) return true;
      const stack = [post.title, post.excerpt, post.author, ...(post.tags || []), post.category].join(' ').toLowerCase();
      return stack.includes(query);
    });

    filtered.sort((a, b) => {
      if (mode === 'oldest') return parseDate(a.date) - parseDate(b.date);
      if (mode === 'title') return (a.title || '').localeCompare(b.title || '');
      return parseDate(b.date) - parseDate(a.date);
    });

    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state">No posts match this filter. Try a different topic or keyword.</div>';
      return;
    }

    list.innerHTML = filtered.map((post, index) => `
      <article class="card blog-card reveal-on-load" style="animation-delay:${Math.min(index * 40, 240)}ms">
        <img src="${escapeHtml(post.cover || '/assets/images/banner.png')}" alt="${escapeHtml(post.title || 'Blog cover')}" loading="lazy">
        <div class="blog-card__meta">
          <span>${escapeHtml(post.date || '')}</span>
          ${post.readTime ? `<span>${escapeHtml(post.readTime)} min read</span>` : ''}
          ${post.author ? `<span>By ${escapeHtml(post.author)}</span>` : ''}
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt || '')}</p>
        <div class="tag-row">${(post.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <a class="button button-secondary" href="/blog/post/?slug=${encodeURIComponent(post.slug)}">Read post</a>
      </article>
    `).join('');
  };

  const load = async () => {
    const raw = await fetch('/content/blog/index.json').then((response) => response.json()).catch(() => null);
    const posts = Array.isArray(raw) ? raw : (raw?.posts || []);
    allPosts = posts.filter((post) => post?.slug && post?.title);
    updateStats(allPosts);
    renderTopics(allPosts);
    renderPosts();
  };

  search?.addEventListener('input', renderPosts);
  sort?.addEventListener('change', renderPosts);
  load();
})();
