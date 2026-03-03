(async () => {
  const root = document.querySelector('[data-blog-post]');
  if (!root) return;
  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) { root.innerHTML = '<p>Missing post slug.</p>'; return; }

  const post = await fetch(`/content/blog/posts/${slug}.json`).then((r) => r.json()).catch(() => null);
  if (!post) { root.innerHTML = '<p>Post not found.</p>'; return; }

  const blockHtml = (b) => {
    if (b.type === 'heading') return `<h${b.level || 2}>${b.content}</h${b.level || 2}>`;
    if (b.type === 'text') return `<p>${b.content}</p>`;
    if (b.type === 'image') return `<img src="${b.src}" alt="${b.alt || ''}" loading="lazy">`;
    if (b.type === 'quote') return `<blockquote>${b.content}</blockquote>`;
    if (b.type === 'list') return `<ul>${(b.items || []).map((i) => `<li>${i}</li>`).join('')}</ul>`;
    if (b.type === 'links') return `<p>${(b.items || []).map((i) => `<a href="${i.url}">${i.label}</a>`).join(' · ')}</p>`;
    return '';
  };

  root.innerHTML = `
    <article class="page-hero">
      <p class="page-meta">${post.date}</p>
      <h1>${post.title}</h1>
      <div class="tag-row">${(post.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}</div>
    </article>
    <article class="page-section prose" style="margin-top:1rem;">
      ${(post.blocks || []).map(blockHtml).join('')}
    </article>
  `;
})();
