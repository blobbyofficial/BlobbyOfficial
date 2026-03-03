(() => {
  const list = document.querySelector('[data-links-list]');
  const social = document.querySelector('[data-links-social]');
  const nameNode = document.querySelector('[data-links-name]');
  const bioNode = document.querySelector('[data-links-bio]');
  const countNode = document.querySelector('[data-links-count]');
  if (!list || !social) return;

  const esc = (v) => String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const safeUrl = (url) => {
    const v = String(url || '').trim();
    if (v.startsWith('/') || v.startsWith('https://') || v.startsWith('http://') || v.startsWith('mailto:')) return v;
    return '#';
  };

  const isExternal = (url) => String(url || '').startsWith('http');

  const load = async () => {
    const data = await fetch('/content/links/links.json').then((r) => r.json()).catch(() => null);
    if (!data) {
      list.innerHTML = '<p class="links-error">Unable to load links right now.</p>';
      social.innerHTML = '';
      if (countNode) countNode.textContent = '0 curated links';
      return;
    }

    if (nameNode) nameNode.textContent = data.name || 'BlobbyOfficial';
    if (bioNode) bioNode.textContent = data.bio || '';

    const socials = Array.isArray(data.social) ? data.social : [];
    const links = Array.isArray(data.links) ? data.links : [];

    social.innerHTML = socials.map((item) => {
      const url = safeUrl(item.url);
      return `<a class="social-chip" href="${esc(url)}" ${isExternal(url) ? 'target="_blank" rel="noopener noreferrer"' : ''}>${esc(item.label || 'Link')}</a>`;
    }).join('');

    list.innerHTML = links.map((item, index) => {
      const url = safeUrl(item.url);
      return `
        <a class="link-button" href="${esc(url)}" ${isExternal(url) ? 'target="_blank" rel="noopener noreferrer"' : ''} style="animation-delay:${Math.min(index * 55, 330)}ms">
          <span class="link-button__text">
            <strong>${esc(item.title || 'Untitled')}</strong>
            <small>${esc(item.subtitle || '')}</small>
          </span>
          <span class="link-button__arrow" aria-hidden="true">→</span>
        </a>
      `;
    }).join('');

    if (countNode) countNode.textContent = `${links.length} curated links`;
  };

  load();
})();
