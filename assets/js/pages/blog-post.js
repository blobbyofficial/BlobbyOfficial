(() => {
  const root = document.querySelector('[data-blog-post]');
  if (!root) return;

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const safeUrl = (value) => {
    const url = String(value || '').trim();
    if (!url) return '#';
    if (url.startsWith('/')) return url;
    if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:')) return url;
    return '#';
  };

  const slugify = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const renderInline = (text) => {
    let output = escapeHtml(text || '');
    output = output.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    output = output.replace(/\*(.+?)\*/g, '<em>$1</em>');
    output = output.replace(/`(.+?)`/g, '<code>$1</code>');
    return output;
  };

  const blockHtml = (block, headingStore) => {
    if (!block?.type) return '';

    if (block.type === 'heading') {
      const level = Math.min(Math.max(Number(block.level) || 2, 2), 4);
      const text = String(block.content || '');
      const id = slugify(text);
      headingStore.push({ text, id });
      return `<h${level} id="${escapeHtml(id)}">${renderInline(text)}</h${level}>`;
    }

    if (block.type === 'text') return `<p>${renderInline(block.content)}</p>`;

    if (block.type === 'list') {
      const items = (block.items || []).map((item) => `<li>${renderInline(item)}</li>`).join('');
      const tag = block.ordered ? 'ol' : 'ul';
      return `<${tag}>${items}</${tag}>`;
    }

    if (block.type === 'quote') {
      const cite = block.citation ? `<cite>${escapeHtml(block.citation)}</cite>` : '';
      return `<blockquote><p>${renderInline(block.content)}</p>${cite}</blockquote>`;
    }

    if (block.type === 'image') {
      const caption = block.caption ? `<figcaption>${renderInline(block.caption)}</figcaption>` : '';
      return `<figure><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || '')}" loading="lazy">${caption}</figure>`;
    }

    if (block.type === 'gallery') {
      const images = (block.items || []).map((item) => `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || '')}" loading="lazy">`).join('');
      return `<div class="blog-gallery">${images}</div>`;
    }

    if (block.type === 'links') {
      const links = (block.items || [])
        .map((item) => `<a href="${escapeHtml(safeUrl(item.url))}" ${String(item.url || '').startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(item.label || item.url || '')}</a>`)
        .join(' · ');
      return `<p>${links}</p>`;
    }

    if (block.type === 'callout') return `<aside class="blog-callout"><strong>${escapeHtml(block.title || 'Note')}:</strong> ${renderInline(block.content)}</aside>`;
    if (block.type === 'divider') return '<hr>';

    if (block.type === 'code') {
      return `<pre class="blog-code"><code>${escapeHtml(block.content || '')}</code></pre>`;
    }

    if (block.type === 'table') {
      const headers = (block.headers || []).map((item) => `<th>${escapeHtml(item)}</th>`).join('');
      const rows = (block.rows || []).map((row) => `<tr>${(row || []).map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`).join('');
      return `<table class="blog-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    }

    if (block.type === 'references') {
      const items = (block.items || []).map((item) => `<li>${renderInline(item)}</li>`).join('');
      return `<section><h3>References</h3><ol>${items}</ol></section>`;
    }

    return '';
  };

  const renderError = (message) => {
    root.innerHTML = `<section class="page-section"><p>${escapeHtml(message)}</p><a class="button button-secondary" href="/blog/">Back to blog</a></section>`;
  };

  const load = async () => {
    const slug = new URLSearchParams(location.search).get('slug');
    if (!slug) {
      renderError('Missing post slug.');
      return;
    }

    const post = await fetch(`/content/blog/posts/${encodeURIComponent(slug)}.json`).then((response) => response.json()).catch(() => null);
    if (!post) {
      renderError('Post not found.');
      return;
    }

    const headings = [];
    const blocks = Array.isArray(post.blocks) ? post.blocks : [];
    const prose = blocks.map((block) => blockHtml(block, headings)).join('');

    const toc = headings.length
      ? `<aside class="blog-toc reveal-on-load reveal-delay-1"><strong>On this page</strong><ol>${headings.map((item) => `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`).join('')}</ol></aside>`
      : '';

    root.innerHTML = `
      <article class="page-hero blog-post-header reveal-on-load">
        <p class="page-meta">${escapeHtml(post.date || '')}${post.readTime ? ` · ${escapeHtml(post.readTime)} min read` : ''}${post.author ? ` · ${escapeHtml(post.author)}` : ''}</p>
        <h1>${escapeHtml(post.title || '')}</h1>
        ${post.lede ? `<p class="post-lede">${renderInline(post.lede)}</p>` : ''}
        <div class="tag-row">${(post.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
      </article>
      <section class="blog-post-layout">
        <article class="page-section prose blog-post-prose reveal-on-load reveal-delay-1">${prose}</article>
        ${toc}
      </section>
    `;
  };

  load();
})();
