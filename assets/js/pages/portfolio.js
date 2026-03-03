(() => {
  const mount = document.querySelector('[data-portfolio]');
  const statsRoot = document.querySelector('[data-portfolio-stats]');
  const search = document.querySelector('[data-portfolio-search]');
  const typeSelect = document.querySelector('[data-portfolio-type]');
  if (!mount) return;

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const safeUrl = (value) => {
    const url = String(value || '').trim();
    if (!url) return '#';
    if (url.startsWith('/') || url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:')) return url;
    return '#';
  };

  const stars = (n) => '★'.repeat(Math.max(0, Math.min(5, Number(n) || 0))) + '☆'.repeat(5 - Math.max(0, Math.min(5, Number(n) || 0)));

  let data = null;

  const updateStats = () => {
    if (!statsRoot || !data) return;
    const projectCount = (data.projects || []).length;
    const reviewCount = (data.testimonials || []).length;
    const platformCount = (data.platforms || []).length;
    statsRoot.innerHTML = `<span>${projectCount} projects</span><span>${reviewCount} testimonials</span><span>${platformCount} platforms</span>`;
  };

  const render = () => {
    if (!data) return;
    const query = search?.value.trim().toLowerCase() || '';
    const selectedType = typeSelect?.value || 'all';

    const projects = (data.projects || []).filter((project) => {
      if (selectedType !== 'all' && project.type !== selectedType) return false;
      if (!query) return true;
      const stack = [project.title, project.summary, project.platform, ...(project.tags || [])].join(' ').toLowerCase();
      return stack.includes(query);
    });

    mount.innerHTML = `
      <section class="page-section reveal-on-load">
        <h2>Platforms</h2>
        <div class="platform-grid">
          ${(data.platforms || []).map((platform) => `
            <article class="platform-card">
              <h3>${escapeHtml(platform.name)}</h3>
              <p class="page-meta">${escapeHtml(platform.description || '')}</p>
              <a href="${escapeHtml(safeUrl(platform.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(platform.handle || platform.url || 'Open')}</a>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="page-section reveal-on-load reveal-delay-1">
        <h2>Performance highlights</h2>
        <div class="stat-grid">
          ${(data.stats || []).map((stat) => `
            <article class="stat-card">
              <p class="page-meta">${escapeHtml(stat.label)}</p>
              <h3>${escapeHtml(stat.value)}</h3>
              <p>${escapeHtml(stat.context || '')}</p>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="page-section reveal-on-load reveal-delay-1">
        <h2>Selected work</h2>
        <div class="highlight-row">
          ${(data.highlights || []).map((item) => `<article class="highlight-card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary || '')}</p></article>`).join('')}
        </div>
      </section>

      <section class="page-section reveal-on-load reveal-delay-2">
        <h2>Projects</h2>
        ${projects.length ? `<div class="project-grid">${projects.map((project, index) => `
          <article class="project-card reveal-on-load" style="animation-delay:${Math.min(index * 35, 250)}ms">
            ${project.media?.type === 'video'
              ? `<iframe title="${escapeHtml(project.title)}" src="${escapeHtml(project.media.src)}" loading="lazy" allowfullscreen></iframe>`
              : `<img src="${escapeHtml(project.media?.src || '/assets/images/banner.png')}" alt="${escapeHtml(project.media?.alt || project.title)}" loading="lazy">`}
            <div class="project-meta"><span>${escapeHtml(project.platform || '')}</span><span>${escapeHtml(project.type || '')}</span></div>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.summary || '')}</p>
            <div class="tag-row">${(project.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
            ${project.link ? `<a class="button button-secondary" href="${escapeHtml(safeUrl(project.link))}" target="_blank" rel="noopener noreferrer">Open case</a>` : ''}
          </article>
        `).join('')}</div>` : '<div class="empty-state">No projects match your filters.</div>'}
      </section>

      <section class="page-section reveal-on-load reveal-delay-2">
        <h2>Client testimonials</h2>
        <div class="review-grid">
          ${(data.testimonials || []).map((review) => `
            <article class="review-card">
              <p class="stars">${stars(review.rating)} <span class="page-meta">(${escapeHtml(review.rating)}/5)</span></p>
              <p>${escapeHtml(review.text)}</p>
              <p class="page-meta">— ${escapeHtml(review.author)}</p>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="page-section reveal-on-load reveal-delay-2">
        <h2>FAQ</h2>
        <div class="faq-grid">
          ${(data.faq || []).map((item) => `
            <details class="faq-card">
              <summary>${escapeHtml(item.question)}</summary>
              <p>${escapeHtml(item.answer)}</p>
            </details>
          `).join('')}
        </div>
      </section>
    `;
  };

  const load = async () => {
    const raw = await fetch('/content/portfolio/profile.json').then((response) => response.json()).catch(() => null);
    data = raw;
    if (!data) {
      mount.innerHTML = '<section class="page-section"><p>Unable to load portfolio profile data.</p></section>';
      return;
    }

    const types = [...new Set((data.projects || []).map((project) => project.type).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    if (typeSelect) {
      typeSelect.innerHTML = `<option value="all">All types</option>${types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('')}`;
    }

    updateStats();
    render();
  };

  search?.addEventListener('input', render);
  typeSelect?.addEventListener('change', render);
  load();
})();
