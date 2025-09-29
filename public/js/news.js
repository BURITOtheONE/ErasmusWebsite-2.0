// News app with infinite scroll - final fixed version
// Drop-in JS file. Requires elements with IDs:
// #newsContainer, #searchInput, #sortOption, #activeFilters
// API assumed at /api/news and may support optional query params:
// ?page=1&limit=10&q=search&tags=tag1,tag2&sort=date|title

let sentinel = null;
let intersectionObserver = null;

let newsAll = [];               // all articles when API returns full array
let renderedArticles = [];      // articles already rendered (client-side)
let activeFilters = {};         // map: lowerTag -> displayTag
let serverPagination = null;    // null = unknown, true/false after first fetch
let currentPage = 1;
const PAGE_SIZE = 10;           // page size for pagination (both client/server)
let totalPages = Infinity;
let isLoading = false;
let endReached = false;         // whether we've loaded all pages
const DEBOUNCE_MS = 220;
const SCROLL_THRESHOLD_PX = 400; // fallback threshold if IntersectionObserver not available

const BADGE_COLORS = {
  'Politics': 'bg-danger',
  'Technology': 'bg-primary',
  'Sports': 'bg-success',
  'World': 'bg-info',
  'Entertainment': 'bg-warning',
  'Science': 'bg-dark',
  'Economy': 'bg-secondary'
};

// ---------- Utilities ----------
function safeString(v) { return v == null ? '' : String(v); }
function toLower(v) { return safeString(v).toLowerCase(); }
function parseTimestamp(d) {
  if (!d) return 0;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : 0;
}
function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
function isProbablyPaginatedResponse(obj) {
  // Heuristics: object with 'items' or 'data' array and maybe total/totalPages
  return obj && (Array.isArray(obj.items) || Array.isArray(obj.data) || obj.totalPages || obj.total);
}

// ---------- Search / Sort handlers (declared early to avoid TDZ) ----------
const debouncedSearchHandler = debounce(() => {
  resetAndFetch();
}, DEBOUNCE_MS);

function sortChangeHandler() {
  resetAndFetch();
}

// Robust DOM ready
function initializeApp() {
  console.log('📰 Initializing News App with infinite scroll');
  setupEventTargets();
  fetchInitialNews();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// ---------- Setup DOM references & sentinel ----------
function setupEventTargets() {
  // Create sentinel node at end of container (if not present)
  const container = document.getElementById('newsContainer');

  if (!container) {
    console.warn('⚠️ newsContainer not found - infinite scroll disabled');
  } else {
    // If sentinel already exists in DOM use it, otherwise create and append after container
    sentinel = document.getElementById('infiniteScrollSentinel');
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.id = 'infiniteScrollSentinel';
      sentinel.style.width = '100%';
      sentinel.style.height = '1px';
      sentinel.style.display = 'block';
      if (typeof container.after === 'function') {
        container.after(sentinel);
      } else if (container.parentNode) {
        container.parentNode.appendChild(sentinel);
      }
    }
  }

  // IntersectionObserver for reliable infinite scroll
  if ('IntersectionObserver' in window && sentinel) {
    if (intersectionObserver) {
      try { intersectionObserver.disconnect(); } catch (e) { /* ignore */ }
      intersectionObserver = null;
    }
    intersectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isLoading && !endReached) {
          loadNextPage();
        }
      });
    }, {
      root: null,
      rootMargin: '200px',
      threshold: 0.01
    });
    try {
      intersectionObserver.observe(sentinel);
    } catch (err) {
      console.warn('⚠️ Observer.observe failed, falling back to scroll listener', err);
      window.addEventListener('scroll', debounce(fallbackScrollHandler, 150));
    }
  } else {
    // Fallback: throttled scroll listener
    try { window.removeEventListener('scroll', fallbackScrollHandler); } catch (e) {}
    window.addEventListener('scroll', debounce(fallbackScrollHandler, 150));
  }

  // Attach search and sort handlers (debounced)
  const searchInput = document.getElementById('searchInput');
  const sortOption = document.getElementById('sortOption');
  if (searchInput) {
    try { searchInput.removeEventListener('input', debouncedSearchHandler); } catch (e) {}
    searchInput.addEventListener('input', debouncedSearchHandler);
  }
  if (sortOption) {
    try { sortOption.removeEventListener('change', sortChangeHandler); } catch (e) {}
    sortOption.addEventListener('change', sortChangeHandler);
  }

  // initialize tag click delegation
  initializeTagClickHandlers();
}

function fallbackScrollHandler() {
  if (isLoading || endReached) return;
  const scrollPos = window.innerHeight + window.scrollY;
  const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  if (docHeight - scrollPos < SCROLL_THRESHOLD_PX) {
    loadNextPage();
  }
}

// ---------- Fetching logic ----------
async function fetchInitialNews() {
  // Try a paginated request first to detect server pagination support
  currentPage = 1;
  endReached = false;
  isLoading = true;
  try {
    const url = `/api/news?page=${currentPage}&limit=${PAGE_SIZE}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    if (isProbablyPaginatedResponse(json)) {
      // Server supports pagination
      serverPagination = true;
      const items = Array.isArray(json.items) ? json.items : (Array.isArray(json.data) ? json.data : []);
      const metaTotalPages = json.totalPages || (json.total && Math.ceil(json.total / PAGE_SIZE)) || Infinity;
      totalPages = Number.isFinite(Number(metaTotalPages)) ? Number(metaTotalPages) : Infinity;
      newsAll = [];            // don't store entire dataset by default
      renderedArticles = [];   // reset
      console.log('📡 Server-side pagination detected. totalPages:', totalPages);
      appendAndRenderServerItems(items, true);
      if (items.length === 0 || currentPage >= totalPages) endReached = true;
    } else if (Array.isArray(json)) {
      // API returned full array - client-side pagination
      serverPagination = false;
      newsAll = json.map(normalizeArticle);
      totalPages = Math.ceil(newsAll.length / PAGE_SIZE) || 1;
      renderedArticles = [];
      console.log('📦 API returned full array. total articles:', newsAll.length, 'totalPages:', totalPages);
      appendAndRenderClientSlice(1, true);
    } else {
      // Unexpected response shape - try to normalize single object
      serverPagination = false;
      newsAll = Array.isArray(json.articles) ? json.articles.map(normalizeArticle) : [];
      totalPages = Math.ceil(newsAll.length / PAGE_SIZE) || 1;
      renderedArticles = [];
      appendAndRenderClientSlice(1, true);
    }
  } catch (err) {
    console.error('❌ Error fetching initial news:', err);
    renderErrorPlaceholder(err.message || 'Error loading news');
  } finally {
    isLoading = false;
  }
}

async function loadNextPage() {
  if (isLoading || endReached) return;
  isLoading = true;
  currentPage += 1;
  try {
    if (serverPagination) {
      // Build server-side query with search/tags/sort
      const params = new URLSearchParams();
      params.set('page', currentPage);
      params.set('limit', PAGE_SIZE);

      const searchInput = document.getElementById('searchInput');
      const q = safeString(searchInput ? searchInput.value.trim() : '');
      if (q) params.set('q', q);

      const sortOption = document.getElementById('sortOption');
      if (sortOption && sortOption.value) params.set('sort', sortOption.value);

      const tags = Object.keys(activeFilters).map(k => encodeURIComponent(activeFilters[k])).join(',');
      if (tags) params.set('tags', tags);

      const url = `/api/news?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const items = Array.isArray(json.items) ? json.items : (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      const metaTotalPages = json.totalPages || (json.total && Math.ceil(json.total / PAGE_SIZE)) || null;
      if (metaTotalPages) totalPages = metaTotalPages;

      appendAndRenderServerItems(items, false);
      if (items.length === 0 || currentPage >= totalPages) endReached = true;
    } else {
      // client-side: incrementally render next slice from newsAll, but filters/search/sort might apply
      appendAndRenderClientSlice(currentPage, false);
    }
  } catch (err) {
    console.error('❌ Error loading next page:', err);
    currentPage = Math.max(1, currentPage - 1);
  } finally {
    isLoading = false;
  }
}

function appendAndRenderServerItems(rawItems = [], replaceAll = false) {
  const normalized = Array.isArray(rawItems) ? rawItems.map(normalizeArticle) : [];
  if (replaceAll) {
    renderedArticles = [];
    clearNewsContainer();
  }
  if (normalized.length > 0) {
    renderedArticles = renderedArticles.concat(normalized);
    renderNews(normalized, { append: true });
  }
  if (normalized.length === 0 && replaceAll) {
    renderNews([], { append: false });
  }
}

function appendAndRenderClientSlice(page = 1, replaceAll = false) {
  // Apply local search+tag+sort to newsAll, then slice
  const filtered = applyClientFiltersAndSort(newsAll);
  totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (page > totalPages) {
    endReached = true;
    return;
  }
  const start = (page - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);
  if (replaceAll) {
    renderedArticles = [];
    clearNewsContainer();
  }
  renderedArticles = renderedArticles.concat(slice);
  renderNews(slice, { append: true });
  if (page >= totalPages) endReached = true;
}

// Reset state and refetch (used for search/sort/tag changes)
function resetAndFetch() {
  currentPage = 0;
  endReached = false;
  if (serverPagination === true) {
    clearNewsContainer();
    currentPage = 0;
    loadNextPage(); // loadNextPage increments page to 1 and fetches with query params
  } else if (serverPagination === false) {
    renderedArticles = [];
    currentPage = 0;
    appendAndRenderClientSlice(1, true);
  } else {
    newsAll = [];
    renderedArticles = [];
    currentPage = 0;
    clearNewsContainer();
    fetchInitialNews();
  }
}

// ---------- Filtering & Sorting helpers (client-side) ----------
function applyClientFiltersAndSort(arr) {
  let result = Array.isArray(arr) ? arr.slice() : [];
  const searchInput = document.getElementById('searchInput');
  const searchTerm = toLower(searchInput ? searchInput.value : '');

  if (searchTerm) {
    result = result.filter(a => {
      const title = toLower(a.title);
      const content = toLower(a.content);
      const tags = Array.isArray(a.tags) ? a.tags.map(toLower) : [];
      return title.includes(searchTerm) || content.includes(searchTerm) || tags.some(t => t.includes(searchTerm));
    });
  }

  const activeKeys = Object.keys(activeFilters);
  if (activeKeys.length > 0) {
    result = result.filter(a => {
      const tags = Array.isArray(a.tags) ? a.tags.map(toLower) : [];
      return activeKeys.every(filterKey => tags.includes(filterKey));
    });
  }

  const sortOption = document.getElementById('sortOption');
  const sortVal = sortOption ? sortOption.value : '';
  if (sortVal) {
    result.sort((A, B) => {
      switch (sortVal) {
        case 'date':
          return parseTimestamp(B.date) - parseTimestamp(A.date);
        case 'title':
          return safeString(A.title).localeCompare(safeString(B.title));
        default:
          return 0;
      }
    });
  }
  return result;
}

// ---------- Tag handling (delegation & normalization) ----------
function initializeTagClickHandlers() {
  const container = document.getElementById('newsContainer');
  if (!container) return;
  try { container.removeEventListener('click', handleTagClick); } catch (e) {}
  container.addEventListener('click', handleTagClick);
}

function handleTagClick(evt) {
  const el = evt.target.closest && evt.target.closest('.tag-clickable');
  if (!el) return;
  evt.preventDefault();
  const displayTag = safeString(el.textContent).trim();
  if (!displayTag) return;
  const key = toLower(displayTag);

  if (activeFilters[key]) {
    delete activeFilters[key];
  } else {
    activeFilters[key] = displayTag;
  }
  updateActiveFiltersDisplay();
  resetAndFetch();
}

// ---------- Active filters UI ----------
function updateActiveFiltersDisplay() {
  const container = document.getElementById('activeFilters');
  if (!container) return;
  container.innerHTML = '';
  const keys = Object.keys(activeFilters);
  if (keys.length === 0) return;

  const label = document.createElement('span');
  label.textContent = 'Active filters: ';
  label.className = 'me-2 fw-semibold';
  container.appendChild(label);

  keys.forEach(k => {
    const display = activeFilters[k];
    const badge = document.createElement('span');
    badge.className = 'badge bg-primary me-2 mb-2 d-inline-flex align-items-center';
    badge.style.gap = '0.4rem';

    const text = document.createElement('span');
    text.textContent = display;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-close btn-close-white ms-2';
    closeBtn.setAttribute('aria-label', 'Remove filter');
    closeBtn.style.fontSize = '0.7em';
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      delete activeFilters[k];
      updateActiveFiltersDisplay();
      resetAndFetch();
    });

    badge.appendChild(text);
    badge.appendChild(closeBtn);
    container.appendChild(badge);
  });
}

// ---------- Rendering ----------
function clearNewsContainer() {
  const container = document.getElementById('newsContainer');
  if (!container) return;
  container.innerHTML = '';
}

function renderErrorPlaceholder(message) {
  const container = document.getElementById('newsContainer');
  if (!container) return;
  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="alert alert-danger">
        <h4>Error loading news</h4>
        <p>${safeString(message)}</p>
        <button class="btn btn-primary mt-2" onclick="location.reload()">Retry</button>
      </div>
    </div>
  `;
}

// items: array of normalized articles to render in this batch
// options: { append: true|false }
function renderNews(items, options = { append: false }) {
  const container = document.getElementById('newsContainer');
  if (!container) {
    console.error('❌ newsContainer not found');
    return;
  }

  if (!options.append) {
    container.innerHTML = '';
  }

  if (!Array.isArray(items) || items.length === 0) {
    // If append false and empty, show placeholder. If append true, do nothing.
    if (!options.append) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="alert alert-info">
            <h4><i class="fas fa-search"></i> No news found</h4>
            <p>Try adjusting your search or removing filters.</p>
          </div>
        </div>
      `;
    }
    return;
  }

  // Create document fragment for performance
  const frag = document.createDocumentFragment();

  items.forEach((article) => {
    try {
      const col = document.createElement('div');
      col.className = 'col-lg-6 col-md-12 mb-4';

      const card = document.createElement('div');
      card.className = 'card h-100 shadow-sm rounded-4 border-0 d-flex flex-column';

      const img = document.createElement('img');
      img.className = 'card-img-top rounded-4';
      img.src = article.imageUrl || 'https://via.placeholder.com/800x400?text=No+Image';
      img.alt = safeString(article.title) + ' image';
      img.style.height = '250px';
      img.style.objectFit = 'cover';
      img.loading = 'lazy';
      img.onerror = function () { this.src = 'https://via.placeholder.com/800x400?text=Image+Not+Found'; };

      const body = document.createElement('div');
      body.className = 'card-body d-flex flex-column';

      const title = document.createElement('h4');
      title.className = 'card-title fw-bold';
      title.textContent = article.title || 'Untitled article';

      const sub = document.createElement('h6');
      sub.className = 'card-subtitle mb-2 text-muted';
      const ts = parseTimestamp(article.date);
      sub.innerHTML = `<i class="fas fa-calendar"></i> ${ts ? new Date(ts).toLocaleString() : 'Unknown date'}`;

      const snippetText = (article.content || article.description || '');
      const snippet = snippetText.length > 220 ? snippetText.slice(0, 220) + '...' : snippetText;
      const desc = document.createElement('p');
      desc.className = 'card-text flex-grow-1';
      desc.textContent = snippet;

      const tagWrap = document.createElement('div');
      tagWrap.className = 'mb-3';
      if (Array.isArray(article.tags) && article.tags.length > 0) {
        article.tags.forEach(t => {
          if (!t) return;
          const display = String(t);
          const tag = document.createElement('span');
          const badgeColor = BADGE_COLORS[display] || BADGE_COLORS[display.trim()] || 'bg-secondary';
          tag.className = `badge me-1 mb-1 ${badgeColor} tag-clickable`;
          tag.textContent = display;
          tag.style.cursor = 'pointer';
          tag.title = `Filter by ${display}`;
          tag.addEventListener('mouseenter', () => { tag.style.opacity = '0.85'; tag.style.transform = 'scale(1.03)'; });
          tag.addEventListener('mouseleave', () => { tag.style.opacity = '1'; tag.style.transform = 'scale(1)'; });
          tagWrap.appendChild(tag);
        });
      }

      const readMore = document.createElement('a');
      readMore.href = article.link || '#';
      readMore.className = 'btn btn-outline-primary btn-sm mt-2 align-self-start';
      readMore.innerHTML = '<i class="fas fa-book-open"></i> Read More';
      readMore.target = '_blank';
      readMore.rel = 'noopener noreferrer';

      body.appendChild(title);
      body.appendChild(sub);
      body.appendChild(desc);
      body.appendChild(tagWrap);
      body.appendChild(readMore);

      card.appendChild(img);
      card.appendChild(body);
      col.appendChild(card);
      frag.appendChild(col);
    } catch (err) {
      console.error('❌ Error rendering article:', err, article);
    }
  });

  container.appendChild(frag);
}

// ---------- Normalization ----------
function normalizeArticle(src = {}) {
  const title = safeString(src.title || src.headline || src.name);
  const content = safeString(src.content || src.description || src.body);
  const imageUrl = safeString(src.imageUrl || src.image || src.thumbnail);

  // <-- CHANGED: prefer several common link field names (websiteLink used by admin form)
  const link = safeString(src.link || src.url || src.websiteLink || src.website || src.sourceUrl);

  const date = src.date || src.publishedAt || src.pubDate || null;
  const id = safeString(src._id || src.id || (link ? link : Math.random().toString(36).slice(2, 9)));
  const rawTags = Array.isArray(src.tags) ? src.tags : (Array.isArray(src.categories) ? src.categories : []);
  const tags = rawTags.map(t => String(t));
  return { ...src, _id: id, title, content, imageUrl, link, date, tags };
}

// ---------- Debug helper ----------
window.debugNewsApp = function () {
  console.log('🔍 === DEBUG INFO ===');
  console.log('serverPagination:', serverPagination);
  console.log('currentPage:', currentPage, 'pageSize:', PAGE_SIZE, 'totalPages:', totalPages, 'endReached:', endReached);
  console.log('Articles loaded (newsAll length):', Array.isArray(newsAll) ? newsAll.length : 0);
  console.log('Rendered articles count:', renderedArticles.length);
  console.log('Active filters (lower -> display):', activeFilters);
  console.log('Search input element:', document.getElementById('searchInput'));
  console.log('Sort option element:', document.getElementById('sortOption'));
  console.log('News container element:', document.getElementById('newsContainer'));
  console.log('Sentinel element:', document.getElementById('infiniteScrollSentinel'));
  console.log('Document ready state:', document.readyState);
};

console.log('📋 News JS with infinite scroll loaded (sentinel/init fixed)');
// End of news.js