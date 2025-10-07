// Simple loader to fetch and render latest 3 news items into #latestNewsContainer

(function () {
  const CONTAINER_ID = 'latestNewsContainer';
  const LIMIT = 3;
  const PLACEHOLDER_COUNT = 3;

  function safeString(v) { return v == null ? '' : String(v); }
  function shortText(t, len = 100) { t = safeString(t); return t.length > len ? t.slice(0, len) + '...' : t; }
  function formatDate(d) { try { return new Date(d).toLocaleDateString(); } catch (e) { return ''; } }

  function createPlaceholderCard() {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm placeholder-wave">
        <div class="card-img-top bg-secondary" style="height:180px; opacity: .08;"></div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title placeholder-glow"><span class="placeholder col-7"></span></h5>
          <p class="card-text placeholder-glow flex-grow-1"><span class="placeholder col-12"></span></p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <span class="placeholder col-4"></span>
            <span class="placeholder col-3"></span>
          </div>
        </div>
      </div>
    `;
    return col;
  }

  function renderError(container, message) {
    container.innerHTML = `
      <div class="col-12 text-center py-4">
        <div class="alert alert-danger mb-0">
          <strong>Error loading news.</strong> ${safeString(message)}
        </div>
      </div>
    `;
  }

  function renderNewsItems(container, items) {
    container.innerHTML = '';
    items.forEach(item => {
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-4';
      const image = safeString(item.image || item.imageUrl || item.thumbnail || '');
      const title = safeString(item.title || item.headline || 'Untitled');
      const content = shortText(item.content || item.description || '');
      const link = safeString(item.slug ? `/news/${item.slug}` : (item.link || item.url || '#'));
      const date = formatDate(item.date || item.publishedAt || '');

      col.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img class="card-img-top" src="${image || 'assets/img/placeholder-800x400.png'}" alt="${title}" style="height:180px;object-fit:cover;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${title}</h5>
            <p class="card-text text-black-50">${content}</p>
            <div class="mt-auto d-flex justify-content-between align-items-center">
              <a href="${link}" class="btn btn-primary btn-sm">Read more</a>
              <small class="text-muted">${date}</small>
            </div>
          </div>
        </div>
      `;
      container.appendChild(col);
    });
  }

  async function loadLatest() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    // show placeholders
    container.innerHTML = '';
    for (let i = 0; i < PLACEHOLDER_COUNT; i++) container.appendChild(createPlaceholderCard());

    try {
      const res = await fetch(`/api/news?limit=${LIMIT}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      // Accept array or {items: [...]}
      const items = Array.isArray(json) ? json : (Array.isArray(json.items) ? json.items : (Array.isArray(json.data) ? json.data : []));
      if (!items || items.length === 0) {
        container.innerHTML = `
          <div class="col-12 text-center py-4">
            <div class="alert alert-info mb-0">No recent news.</div>
          </div>
        `;
        return;
      }
      renderNewsItems(container, items.slice(0, LIMIT));
    } catch (err) {
      console.error('Error loading latest news:', err);
      renderError(container, err.message || 'Failed to load');
    }
  }

  // init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLatest);
  } else {
    loadLatest();
  }
})();