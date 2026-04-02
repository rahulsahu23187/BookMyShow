// js/movies.js
let ALL_MOVIES = [];
let banIdx = 0;
let banTimer = null;

/* TMDB image base URL use kiya gaya hai */
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

const MOOD_MAP = {
  '😊 Happy': ['Comedy', 'Animation', 'Musical', 'Family'],
  '😢 Emotional': ['Drama', 'Romance', 'Inspirational', 'Biographical'],
  '😱 Thrilled': ['Thriller', 'Horror', 'Mystery', 'Spy'],
  '💪 Pumped': ['Action', 'War', 'Sports', 'Crime'],
  '🚀 Curious': ['Sci-Fi', 'Documentary', 'Mythology', 'Adventure'],
  '❤️ Romantic': ['Romance', 'Drama'],
  '😤 Intense': ['Action', 'Crime', 'Political'],
  '🧘 Calm': ['Drama', 'Inspirational', 'Historical']
};

const SVG_FALLBACK_POSTER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a0000"/>
          <stop offset="100%" stop-color="#111111"/>
        </linearGradient>
      </defs>
      <rect width="600" height="900" fill="url(#g)"/>
      <circle cx="470" cy="140" r="90" fill="rgba(229,9,20,.22)"/>
      <text x="50%" y="44%" text-anchor="middle" fill="#ffffff" font-size="90" font-family="Arial">🎬</text>
      <text x="50%" y="54%" text-anchor="middle" fill="#ff5c67" font-size="34" font-family="Arial">BookMyShow</text>
      <text x="50%" y="60%" text-anchor="middle" fill="#dddddd" font-size="24" font-family="Arial">Poster Not Available</text>
    </svg>
  `);

function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeText(v, fallback = '') {
  return (v === null || v === undefined || v === '') ? fallback : String(v);
}

function normalizePoster(url) {
  if (!url || typeof url !== 'string') return SVG_FALLBACK_POSTER;

  let src = url.trim();
  if (!src) return SVG_FALLBACK_POSTER;

  if (src.startsWith('data:')) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('//')) return window.location.protocol + src;

  // TMDB relative path
  if (
    src.startsWith('/') &&
    (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp'))
  ) {
    return TMDB_IMAGE_BASE + src;
  }

  // local assets
  if (src.startsWith('/')) return window.location.origin + src;
  if (/^(uploads\/|images\/|posters\/)/i.test(src)) return window.location.origin + '/' + src;

  return src;
}

function getMovieTitle(m) {
  return safeText(m?.title, 'Untitled Movie');
}

function getMovieGenres(m) {
  return safeArr(m?.genre);
}

function getMovieLang(m) {
  const lang = m?.lang;
  if (Array.isArray(lang)) return lang;
  if (typeof lang === 'string' && lang.trim()) return [lang.trim()];
  return ['Hindi'];
}

function getMovieBg(m) {
  return safeText(m?.bg, '#181818');
}

function getMoviePosterEmoji(m) {
  return safeText(m?.emoji || m?.poster, '🎬');
}

function getMovieRating(m) {
  return safeNum(m?.rating, 0);
}

function getMovieId(m) {
  return safeText(m?._id || m?.id, '');
}

async function fetchMovies(params = {}) {
  try {
    const qs = new URLSearchParams({ ...params, limit: 60 }).toString();
    const d = await API.get(`/movies?${qs}`);

    if (d?.success && Array.isArray(d.movies)) {
      ALL_MOVIES = d.movies;
      return d.movies;
    }

    return [];
  } catch (err) {
    console.error('fetchMovies error:', err);
    return [];
  }
}

function isWishlistedSafe(id) {
  if (!id) return false;

  if (typeof isWishlisted === 'function') {
    try {
      return isWishlisted(id);
    } catch {}
  }

  try {
    const wl = JSON.parse(localStorage.getItem('mz_wishlist') || '[]');
    return wl.includes(id);
  } catch {
    return false;
  }
}

async function toggleWLSafe(id, btn) {
  if (!id) return;

  if (typeof toggleWL === 'function') {
    try {
      return await toggleWL(id, btn);
    } catch (err) {
      console.error('toggleWL fallback error:', err);
    }
  }

  try {
    let wl = JSON.parse(localStorage.getItem('mz_wishlist') || '[]');

    if (wl.includes(id)) {
      wl = wl.filter(x => x !== id);
    } else {
      wl.push(id);
    }

    localStorage.setItem('mz_wishlist', JSON.stringify(wl));

    if (btn) {
      const on = wl.includes(id);
      btn.classList.toggle('on', on);
      btn.textContent = on ? '❤️' : '🤍';
    }
  } catch (err) {
    console.error('toggleWLSafe error:', err);
  }
}

function getPosterMarkup(m, cls = 'movie-poster-img', fallbackSize = '3.5rem') {
  const fallback = getMoviePosterEmoji(m);
  const poster = normalizePoster(m?.poster);
  const title = getMovieTitle(m);

  return `
    <img
      src="${escAttr(poster)}"
      alt="${escAttr(title)}"
      class="${escAttr(cls)}"
      style="width:100%;height:100%;object-fit:cover;display:block;"
      onerror="this.onerror=null;this.src='${escAttr(SVG_FALLBACK_POSTER)}';"
    />
    <span
      class="movie-poster-fallback"
      style="display:none;font-size:${fallbackSize};position:absolute;inset:0;align-items:center;justify-content:center;z-index:1"
    >${escHtml(fallback)}</span>
  `;
}

function renderCard(m, badge = '') {
  const id = getMovieId(m);
  const inWL = isWishlistedSafe(id);
  const title = getMovieTitle(m);
  const genres = getMovieGenres(m);
  const rating = getMovieRating(m);
  const duration = safeText(m?.duration, '');
  const upcoming = !!m?.upcoming;
  const certificate = safeText(m?.certificate, 'U/A');
  const bg = getMovieBg(m);
  const tag = badge || safeText(m?.tags?.[0], '');

  return `
    <div class="movie-card" onclick="location.href='movie.html?id=${escAttr(id)}'">
      <div class="card-poster" style="background:${escAttr(bg)};position:relative;">
        ${tag ? `<div class="card-tag">${escHtml(tag)}</div>` : ''}
        <button class="card-wl ${inWL ? 'on' : ''}" onclick="event.stopPropagation();handleWL('${escAttr(id)}',this)">${inWL ? '❤️' : '🤍'}</button>

        ${getPosterMarkup(m, 'movie-card-img', '3.3rem')}
      </div>

      <div class="card-body">
        <div class="card-title">${escHtml(title)}</div>
        <div class="card-meta">
          <span class="card-rating">★ ${rating}</span>
          <span>·</span>
          <span>${escHtml(genres[0] || 'Movie')}</span>
          ${upcoming ? '<span>·</span><span style="color:var(--purple)">Soon</span>' : ''}
        </div>
      </div>

      <div class="card-expand">
        <div class="card-expand-btns">
          <div class="ce-btn play" onclick="event.stopPropagation();location.href='movie.html?id=${escAttr(id)}'">▶</div>
          <div class="ce-btn" onclick="event.stopPropagation();handleWL('${escAttr(id)}',this)">${inWL ? '❤️' : '➕'}</div>
          <div class="ce-btn" title="${escAttr(certificate)}">🏷️</div>
          <div class="ce-more" onclick="event.stopPropagation();location.href='movie.html?id=${escAttr(id)}'">ⓘ</div>
        </div>
        <div class="ce-title">${escHtml(title)}</div>
        <div class="ce-meta">
          <span class="ce-rating">★ ${rating}/10</span>
          ${(genres.length || duration) ? ' · ' : ''}
          ${escHtml(genres.slice(0, 2).join(' · '))}
          ${(genres.length && duration) ? ' · ' : ''}
          ${escHtml(duration)}
        </div>
      </div>
    </div>
  `;
}

window.handleWL = async (id, btn) => {
  await toggleWLSafe(id, btn);
};

function renderGrid(id, movies, badge = '') {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = movies.length
    ? movies.map(m => renderCard(m, badge)).join('')
    : `<p style="color:var(--mt);grid-column:1/-1;padding:20px;text-align:center">No movies found</p>`;
}

function renderRow(id, movies, badge = '') {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = movies.length
    ? movies.map(m => renderCard(m, badge)).join('')
    : `<p style="color:var(--mt);padding:20px;text-align:center">No movies found</p>`;
}

function showBanner(movies, idx) {
  const wrap = document.getElementById('bannerWrap');
  const dotsEl = document.getElementById('bannerDots');
  if (!wrap || !movies.length) return;

  const safeIdx = ((idx % movies.length) + movies.length) % movies.length;
  const m = movies[safeIdx];

  const title = getMovieTitle(m);
  const rating = getMovieRating(m);
  const genres = getMovieGenres(m);
  const langs = getMovieLang(m);
  const duration = safeText(m?.duration, '');
  const certificate = safeText(m?.certificate, 'U/A');
  const description = safeText(m?.description, 'No description available.');
  const movieId = getMovieId(m);
  const bg = getMovieBg(m);
  const posterUrl = normalizePoster(m?.poster);

  const bannerPosterMain = `
    <div class="banner-emoji" style="font-size:0;width:220px;height:330px;display:flex;align-items:center;justify-content:center;">
      <img
        src="${escAttr(posterUrl)}"
        alt="${escAttr(title)}"
        style="width:100%;height:100%;object-fit:cover;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.45);"
        onerror="this.onerror=null;this.src='${escAttr(SVG_FALLBACK_POSTER)}';"
      />
    </div>
  `;

  const bannerBgVisual = `
    <div class="banner-emoji-bg" style="font-size:0;">
      <img
        src="${escAttr(posterUrl)}"
        alt="${escAttr(title)}"
        style="width:100%;height:100%;object-fit:cover;opacity:.22;"
        onerror="this.onerror=null;this.src='${escAttr(SVG_FALLBACK_POSTER)}';"
      />
    </div>
  `;

  const slide = wrap.querySelector('.banner-slide');

  const bannerHtml = `
    <div class="banner-overlay"></div>
    ${bannerBgVisual}
    <div class="banner-content">
      <div class="banner-badge">🔥 #${safeIdx + 1} in India Today</div>
      ${bannerPosterMain}
      <div class="banner-genre">${escHtml(genres.join(' · ') || 'Movie')}</div>
      <h1 class="banner-title">${escHtml(title)}</h1>
      <div class="banner-meta">
        <span class="b-match">${rating >= 9 ? '97% Match' : rating >= 8 ? '92% Match' : '85% Match'}</span>
        <span class="b-rating">★ ${rating}/10</span>
        <span class="b-sep">·</span><span>${escHtml(duration)}</span>
        <span class="b-sep">·</span><span>${escHtml(certificate)}</span>
        <span class="b-sep">·</span><span>${escHtml(langs[0] || 'Hindi')}</span>
      </div>
      <p class="banner-desc">${escHtml(description.slice(0, 130))}${description.length > 130 ? '...' : ''}</p>
      <div class="banner-acts">
        <a href="movie.html?id=${escAttr(movieId)}" class="btn btn-red btn-lg">▶ &nbsp;Book Tickets</a>
        <a href="movie.html?id=${escAttr(movieId)}" class="btn btn-glass btn-lg">ℹ️ &nbsp;More Info</a>
      </div>
    </div>
  `;

  if (slide) {
    slide.style.background = `linear-gradient(180deg,${bg}88 0%,${bg} 100%)`;
    slide.innerHTML = bannerHtml;
  } else {
    wrap.innerHTML = `
      <div class="banner-slide" style="background:linear-gradient(180deg,${escAttr(bg)}88 0%,${escAttr(bg)} 100%)">
        ${bannerHtml}
      </div>
    `;
  }

  if (dotsEl) {
    dotsEl.innerHTML = movies.map((_, i) =>
      `<div class="b-dot ${i === safeIdx ? 'on' : ''}" onclick="jumpBanner(${i})"></div>`
    ).join('');
  } else {
    const insideDots = wrap.querySelector('.banner-dots');
    if (insideDots) {
      insideDots.innerHTML = movies.map((_, i) =>
        `<div class="b-dot ${i === safeIdx ? 'on' : ''}" onclick="jumpBanner(${i})"></div>`
      ).join('');
    }
  }
}

window.jumpBanner = function(idx) {
  const trending = ALL_MOVIES.filter(m => m?.trending).slice(0, 5);
  if (!trending.length) return;

  banIdx = ((idx % trending.length) + trending.length) % trending.length;
  clearInterval(banTimer);
  showBanner(trending, banIdx);
  banTimer = setInterval(() => {
    banIdx = (banIdx + 1) % trending.length;
    showBanner(trending, banIdx);
  }, 5500);
};

function startBanner() {
  const trending = ALL_MOVIES.filter(m => m?.trending).slice(0, 5);
  if (!trending.length) return;

  showBanner(trending, banIdx);
  clearInterval(banTimer);
  banTimer = setInterval(() => {
    banIdx = (banIdx + 1) % trending.length;
    showBanner(trending, banIdx);
  }, 5500);
}

function getSmartRecs() {
  let bks = [];
  try {
    bks = JSON.parse(localStorage.getItem('mz_bookings') || '[]');
  } catch {
    bks = [];
  }

  if (!bks.length) {
    return ALL_MOVIES.filter(m => m?.recommended).slice(0, 10);
  }

  const gc = {};
  bks.forEach(b => {
    safeArr(b?.genres).forEach(g => {
      gc[g] = (gc[g] || 0) + 1;
    });
  });

  const ids = bks.map(b => String(b.movieId || ''));

  return ALL_MOVIES
    .filter(m => !ids.includes(String(m?._id || '')))
    .map(m => ({
      ...m,
      _s: getMovieGenres(m).reduce((a, g) => a + (gc[g] || 0), 0)
    }))
    .sort((a, b) => (b._s - a._s) || (getMovieRating(b) - getMovieRating(a)))
    .slice(0, 10);
}

function getSearchEls() {
  return {
    searchSection: document.getElementById('searchResultsSection') || document.getElementById('searchResultsSec'),
    mainSection: document.getElementById('mainSections') || document.getElementById('mainSecs'),
    searchQuery: document.getElementById('searchQuery') || document.getElementById('srQuery'),
    searchCount: document.getElementById('searchCount') || document.getElementById('srCount'),
    searchGrid: document.getElementById('searchGrid') || document.getElementById('srGrid')
  };
}

async function initHomepage() {
  const movies = await fetchMovies({ limit: 60 });

  if (!movies.length) {
    const bannerWrap = document.getElementById('bannerWrap');
    if (bannerWrap) {
      bannerWrap.innerHTML = `
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0a0a0a;flex-direction:column;gap:16px;min-height:440px">
          <div style="font-size:3rem">⚠️</div>
          <div style="font-size:1rem;color:#fff;font-weight:700">Backend not connected</div>
          <div style="font-size:.88rem;color:#888;text-align:center">
            Run: npm install → npm run seed → npm start<br>Open: http://localhost:5000
          </div>
        </div>
      `;
    }
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.add('gone');
    return;
  }

  const qParam = new URLSearchParams(location.search).get('q');
  const { searchSection, mainSection, searchQuery, searchCount, searchGrid } = getSearchEls();

  if (qParam) {
    if (searchSection) searchSection.style.display = 'block';
    if (mainSection) mainSection.style.display = 'none';
    if (searchQuery) searchQuery.textContent = `"${qParam}"`;

    const qp = qParam.toLowerCase();
    const res = movies.filter(m =>
      getMovieTitle(m).toLowerCase().includes(qp) ||
      getMovieGenres(m).some(g => String(g).toLowerCase().includes(qp))
    );

    if (searchCount) searchCount.textContent = `${res.length} results`;

    if (searchGrid) {
      searchGrid.innerHTML = res.length
        ? res.map(m => renderCard(m, '')).join('')
        : `<p style="color:var(--mt);grid-column:1/-1;padding:20px;text-align:center">No movies found</p>`;
    } else {
      renderGrid('srGrid', res, '');
    }

    startBanner();
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.add('gone');
    return;
  }

  startBanner();
  renderGrid('recGrid', getSmartRecs(), '');
  renderRow('trendRow', movies.filter(m => m?.trending), '🔥 HOT');
  renderGrid(
    'nowGrid',
    movies
      .filter(m => m?.nowShowing && !m?.upcoming)
      .sort((a, b) => getMovieRating(b) - getMovieRating(a))
      .slice(0, 10),
    ''
  );
  renderGrid(
    'popGrid',
    movies
      .filter(m => m?.popular)
      .sort((a, b) => getMovieRating(b) - getMovieRating(a))
      .slice(0, 10),
    ''
  );
  renderRow('upcomRow', movies.filter(m => m?.upcoming), '📅 SOON');

  initFilters(movies);

  document.querySelectorAll('.mood-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('on'));
      chip.classList.add('on');

      const genres = MOOD_MAP[chip.dataset.mood] || [];
      const filtered = movies.filter(m => getMovieGenres(m).some(g => genres.includes(g)));

      renderGrid('recGrid', filtered.slice(0, 10), '');

      if (typeof TOAST !== 'undefined' && TOAST?.show) {
        TOAST.show(`Showing movies for ${chip.dataset.mood}`, 'info');
      }
    });
  });

  const loader = document.getElementById('pageLoader');
  if (loader) loader.classList.add('gone');
}

function initFilters(movies) {
  const gs = document.getElementById('fGenre');
  const rs = document.getElementById('fRating');
  const ls = document.getElementById('fLang');
  const applyBtn = document.getElementById('applyFiltersBtn') || document.getElementById('fApply');

  if (!gs && !rs && !ls && !applyBtn) return;

  const allGenres = [...new Set(movies.flatMap(m => getMovieGenres(m)))].filter(Boolean);
  const allLangs = [...new Set(movies.flatMap(m => getMovieLang(m)))].filter(Boolean);

  if (gs && !gs.dataset.ready) {
    gs.innerHTML = `<option value="">All Genres</option>` +
      allGenres.map(g => `<option value="${escAttr(g)}">${escHtml(g)}</option>`).join('');
    gs.dataset.ready = '1';
  }

  if (ls && !ls.dataset.ready) {
    ls.innerHTML = `<option value="">All Languages</option>` +
      allLangs.map(l => `<option value="${escAttr(l)}">${escHtml(l)}</option>`).join('');
    ls.dataset.ready = '1';
  }

  const applyFilters = () => {
    const genreVal = gs?.value || '';
    const ratingVal = safeNum(rs?.value || 0, 0);
    const langVal = ls?.value || '';

    let filtered = [...movies];

    if (genreVal) {
      filtered = filtered.filter(m => getMovieGenres(m).includes(genreVal));
    }

    if (ratingVal) {
      filtered = filtered.filter(m => getMovieRating(m) >= ratingVal);
    }

    if (langVal) {
      filtered = filtered.filter(m => getMovieLang(m).includes(langVal));
    }

    renderGrid('nowGrid', filtered.filter(m => m?.nowShowing && !m?.upcoming).slice(0, 10), '');
    renderGrid('popGrid', filtered.filter(m => m?.popular).slice(0, 10), '');
    renderRow('trendRow', filtered.filter(m => m?.trending).slice(0, 10), '🔥 HOT');
    renderRow('upcomRow', filtered.filter(m => m?.upcoming).slice(0, 10), '📅 SOON');
    renderGrid('recGrid', filtered.slice(0, 10), '');

    if (typeof TOAST !== 'undefined' && TOAST?.show) {
      TOAST.show(`Showing ${filtered.length} movies`, 'info');
    }
  };

  if (applyBtn && !applyBtn.dataset.bound) {
    applyBtn.addEventListener('click', applyFilters);
    applyBtn.dataset.bound = '1';
  }

  [gs, rs, ls].forEach(el => {
    if (el && !el.dataset.bound) {
      el.addEventListener('change', applyFilters);
      el.dataset.bound = '1';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (
    document.getElementById('bannerWrap') ||
    document.getElementById('recGrid') ||
    document.getElementById('trendRow') ||
    document.getElementById('nowGrid') ||
    document.getElementById('popGrid') ||
    document.getElementById('upcomRow') ||
    document.getElementById('searchGrid') ||
    document.getElementById('srGrid')
  ) {
    initHomepage();
  }
});