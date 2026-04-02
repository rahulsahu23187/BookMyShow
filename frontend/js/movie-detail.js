// js/movie-detail.js

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

let movieData = null;
let commentRating = 0;
let selectedRating = 0;

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

function safeText(v, fallback = '') {
  return (v === null || v === undefined || v === '') ? fallback : String(v);
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function normalizePoster(url) {
  if (!url || typeof url !== 'string') return SVG_FALLBACK_POSTER;

  let src = url.trim();
  if (!src) return SVG_FALLBACK_POSTER;

  if (src.startsWith('data:')) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('//')) return window.location.protocol + src;

  // TMDB relative path support like /abc.jpg
  if (
    src.startsWith('/') &&
    (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp'))
  ) {
    return TMDB_IMAGE_BASE + src;
  }

  // local absolute path
  if (src.startsWith('/')) return window.location.origin + src;

  // local relative image folders
  if (/^(uploads\/|images\/|posters\/)/i.test(src)) {
    return window.location.origin + '/' + src.replace(/^\/+/, '');
  }

  return src;
}

function toast(msg, type = 'info') {
  if (typeof TOAST !== 'undefined' && TOAST?.show) {
    TOAST.show(msg, type);
  } else {
    console.log(`[${type}] ${msg}`);
  }
}

function getMovieIdFromURL() {
  return new URLSearchParams(location.search).get('id');
}

function isUserLoggedIn() {
  return !!(
    typeof SESSION !== 'undefined' &&
    SESSION &&
    typeof SESSION.isLoggedIn === 'function' &&
    SESSION.isLoggedIn()
  );
}

function getCurrentUser() {
  return (
    typeof SESSION !== 'undefined' &&
    SESSION &&
    typeof SESSION.getUser === 'function'
  ) ? SESSION.getUser() : null;
}

function renderPoster(container, movie) {
  if (!container) return;

  const poster = normalizePoster(movie.poster);
  const fallbackEmoji = safeText(movie.emoji || '🎬', '🎬');
  const title = safeText(movie.title, 'Movie Poster');

  container.innerHTML = `
    <img
      src="${escAttr(poster)}"
      alt="${escAttr(title)}"
      class="movie-detail-poster-img"
      onerror="this.onerror=null;this.src='${escAttr(SVG_FALLBACK_POSTER)}';"
    />
    <span class="mv-poster-fallback" style="display:none">${escHtml(fallbackEmoji)}</span>
  `;
}

function buildGlow(accent) {
  const glow = document.getElementById('mvGlow');
  if (!glow) return;

  glow.innerHTML = '';

  [
    [accent, '-80px', '60px', '280px'],
    [accent, '60px', '380px', '220px']
  ].forEach(([c, t, r, s]) => {
    const blob = document.createElement('div');
    blob.className = 'mv-glow-blob';
    blob.style.cssText = `
      position:absolute;
      border-radius:50%;
      filter:blur(20px);
      width:${s};
      height:${s};
      background:${c};
      top:${t};
      right:${r};
      animation:particleFloat ${3.5 + Math.random() * 2}s ease-in-out infinite alternate;
    `;
    glow.appendChild(blob);
  });
}

function renderDates() {
  const dateStrip = document.getElementById('mvDateStrip');
  if (!dateStrip) return;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();

  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const label = i === 0
      ? 'Today'
      : i === 1
        ? 'Tomorrow'
        : `${days[d.getDay()]}, ${d.getDate()} ${mons[d.getMonth()]}`;

    html += `
      <button class="date-btn ${i === 0 ? 'on' : ''}" onclick="selDate(this,'${label}')">
        <span class="d-num">${d.getDate()}</span>
        <span class="d-day">${days[d.getDay()]}, ${mons[d.getMonth()]}</span>
      </button>
    `;
  }

  dateStrip.innerHTML = html;
  window._selDate = 'Today';
}

function getCinemaList() {
  return [
    {
      name: 'PVR IMAX Juhu, Mumbai',
      tags: ['IMAX 2D', 'M-TICKET', 'F&B'],
      dist: '2.4 km',
      shows: [
        { t: '10:30 AM', s: '' },
        { t: '1:45 PM', s: 'filling' },
        { t: '5:00 PM', s: 'almost' },
        { t: '8:30 PM', s: '' },
        { t: '11:45 PM', s: '' }
      ]
    },
    {
      name: 'Cinépolis Andheri West',
      tags: ['DOLBY', 'RECLINER'],
      dist: '4.1 km',
      shows: [
        { t: '9:00 AM', s: '' },
        { t: '12:30 PM', s: 'almost' },
        { t: '4:15 PM', s: 'filling' },
        { t: '7:30 PM', s: '' }
      ]
    },
    {
      name: 'INOX Nariman Point',
      tags: ['2D', '4DX'],
      dist: '8.7 km',
      shows: [
        { t: '11:00 AM', s: '' },
        { t: '2:30 PM', s: '' },
        { t: '6:00 PM', s: 'filling' },
        { t: '9:30 PM', s: 'almost' }
      ]
    },
    {
      name: 'PVR ICON Goregaon',
      tags: ['PLAYHOUSE', 'RECLINER', 'DOLBY'],
      dist: '5.2 km',
      shows: [
        { t: '10:00 AM', s: '' },
        { t: '1:30 PM', s: '' },
        { t: '4:00 PM', s: 'filling' },
        { t: '7:30 PM', s: '' }
      ]
    },
    {
      name: 'Fun Cinemas K Star Mall Chembur',
      tags: ['2D', 'M-TICKET'],
      dist: '6.8 km',
      shows: [
        { t: '11:30 AM', s: '' },
        { t: '3:00 PM', s: '' },
        { t: '6:30 PM', s: '' },
        { t: '10:00 PM', s: '' }
      ]
    }
  ];
}

function renderCinemas(movie) {
  const cinemasEl = document.getElementById('mvCinemas');
  const fmtSel = document.getElementById('stFmtSel');
  const langSel = document.getElementById('stLangSel');
  if (!cinemasEl) return;

  const formats = safeArr(movie.formats).length ? safeArr(movie.formats) : ['2D', 'IMAX 2D'];
  const cinemas = getCinemaList();

  const selectedFormat =
    fmtSel && fmtSel.value && fmtSel.value !== 'All Formats'
      ? fmtSel.value
      : formats[0];

  const selectedLang =
    langSel && langSel.value && langSel.value !== 'All Languages'
      ? langSel.value
      : '';

  cinemasEl.innerHTML = cinemas.map(c => `
    <div class="cinema-block">
      <div class="cinema-row">
        <div>
          <div class="cinema-name">${escHtml(c.name)}</div>
          <div class="cinema-tags-row">${c.tags.map(t => `<span class="c-tag">${escHtml(t)}</span>`).join('')}</div>
        </div>
        <div class="cinema-dist">📍 ${escHtml(c.dist)}</div>
      </div>
      <div class="show-slots">
        ${c.shows.map(s => `
          <div class="slot ${s.s}" onclick="handleShowClick('${escAttr(movie._id)}','${escAttr(c.name)}','${escAttr(s.t)}','${escAttr(selectedFormat)}','${escAttr(selectedLang)}')">
            ${escHtml(s.t)}
            <span class="slot-avail">${s.s === 'almost' ? 'Almost Full' : s.s === 'filling' ? 'Filling Fast' : 'Available'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderPriceTrend() {
  const trendEl = document.getElementById('priceTrend');
  if (!trendEl) return;

  const heights = [40, 52, 45, 65, 70, 85, 100];
  const daysForTrend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  trendEl.innerHTML = heights.map((h, i) => `
    <div
      title="${daysForTrend[i]}"
      style="flex:1;height:${h}%;background:${i >= 5 ? 'var(--red)' : 'var(--blue)'};border-radius:2px 2px 0 0;opacity:.7;cursor:pointer"
      onclick="showPriceTrendTip()">
    </div>
  `).join('');
}

function renderMovie(movie) {
  const _id = safeText(movie._id, getMovieIdFromURL());
  const title = safeText(movie.title, 'Untitled Movie');
  const rating = safeNum(movie.rating, 8.5);
  const votes = safeText(movie.votes || movie.numVotes, '10K');
  const genre = safeArr(movie.genre).length ? safeArr(movie.genre) : (movie.category ? [movie.category] : ['Drama']);
  const lang = safeArr(movie.lang).length ? safeArr(movie.lang) : (movie.language ? [movie.language] : ['Hindi']);
  const formats = safeArr(movie.formats).length ? safeArr(movie.formats) : ['2D', 'IMAX 2D'];
  const duration = safeText(movie.duration, '2h 20m');
  const certificate = safeText(movie.certificate, 'UA');
  const releaseDate = safeText(movie.releaseDate || movie.release, 'Coming Soon');
  const description = safeText(movie.description, 'No description available.');
  const cast = safeArr(movie.cast).length ? safeArr(movie.cast) : [
    { name: 'Lead Actor', role: 'Hero', emoji: '🎭', color: '#1a1a2e' },
    { name: 'Lead Actress', role: 'Heroine', emoji: '🌟', color: '#2d1b69' },
    { name: 'Director', role: 'Director', emoji: '🎬', color: '#0f3460' }
  ];
  const boxOffice = movie.boxOffice || null;
  const accent = safeText(movie.accent, 'rgba(229,9,20,.25)');
  const bg = safeText(movie.bg, 'linear-gradient(135deg,#0f0f1a,#1a1a2e,#2d1b69)');

  document.title = `${title} — BookMyShow`;

  const mvBg = document.getElementById('mvBg');
  const mvBgTxt = document.getElementById('mvBgTxt');
  const mvPoster = document.getElementById('mvPoster');
  const mvPosterArt = document.getElementById('mvPosterArt');

  if (mvBg) mvBg.style.background = bg;
  if (mvBgTxt) mvBgTxt.textContent = title.toUpperCase();
  if (mvPoster) mvPoster.style.background = bg;
  renderPoster(mvPosterArt, movie);

  buildGlow(accent);

  const mvTitle = document.getElementById('mvTitle');
  const mvScore = document.getElementById('mvScore');
  const mvVotes = document.getElementById('mvVotes');
  const mvMeta = document.getElementById('mvMeta');
  const mvFmts = document.getElementById('mvFmts');
  const mvAbout = document.getElementById('mvAbout');
  const mvCast = document.getElementById('mvCast');
  const mvInfoPanel = document.getElementById('mvInfoPanel');
  const mvBoxOffice = document.getElementById('mvBoxOffice');

  if (mvTitle) mvTitle.textContent = title;
  if (mvScore) mvScore.textContent = rating;
  if (mvVotes) mvVotes.textContent = ` (${votes}+ Votes)`;

  if (mvMeta) {
    mvMeta.innerHTML = `
      <span style="font-size:.83rem;color:var(--t2)">⏱ ${escHtml(duration)}</span>
      <span class="mv-sep">·</span><span style="font-size:.83rem;color:var(--t2)">${escHtml(genre.join(', '))}</span>
      <span class="mv-sep">·</span><span class="mv-cert">${escHtml(certificate)}</span>
      <span class="mv-sep">·</span><span style="font-size:.83rem;color:var(--t1);font-weight:500">${escHtml(releaseDate)}</span>
    `;
  }

  if (mvFmts) {
    mvFmts.innerHTML =
      formats.map(f => `<span class="fmt-pill fmt-type">${escHtml(f)}</span>`).join('') +
      lang.slice(0, 3).map(l => `<span class="fmt-pill fmt-lang">${escHtml(l)}</span>`).join('') +
      (lang.length > 3 ? `<span class="fmt-pill fmt-lang">+${lang.length - 3}</span>` : '');
  }

  if (mvAbout) mvAbout.textContent = description;

  if (mvCast) {
    mvCast.innerHTML = cast.map(c => `
      <div class="cast-card">
        <div class="cast-av" style="background:${escAttr(c.color || '#1a1a2e')}">${escHtml(c.emoji || '🎭')}</div>
        <div class="cast-name">${escHtml(c.name || 'Artist')}</div>
        <div class="cast-role">${escHtml(c.role || 'Cast')}</div>
      </div>
    `).join('');
  }

  const langSel = document.getElementById('stLangSel');
  const fmtSel = document.getElementById('stFmtSel');
  const qbLang = document.getElementById('qbLang');
  const qbFmt = document.getElementById('qbFmt');

  if (langSel) {
    langSel.innerHTML = `<option>All Languages</option>` + lang.map(l => `<option value="${escAttr(l)}">${escHtml(l)}</option>`).join('');
    langSel.onchange = () => renderCinemas(movie);
  }

  if (fmtSel) {
    fmtSel.innerHTML = `<option>All Formats</option>` + formats.map(f => `<option value="${escAttr(f)}">${escHtml(f)}</option>`).join('');
    fmtSel.onchange = () => renderCinemas(movie);
  }

  if (qbLang) {
    qbLang.innerHTML = `<option>Select Language</option>` + lang.map(l => `<option value="${escAttr(l)}">${escHtml(l)}</option>`).join('');
  }

  if (qbFmt) {
    qbFmt.innerHTML = `<option>Select Format</option>` + formats.map(f => `<option value="${escAttr(f)}">${escHtml(f)}</option>`).join('');
  }

  renderCinemas(movie);

  if (mvInfoPanel) {
    mvInfoPanel.innerHTML = `
      <div class="ip-title">ℹ️ Movie Info</div>
      <div class="ip-row"><span class="ip-k">Language</span><span class="ip-v">${escHtml(lang.join(', '))}</span></div>
      <div class="ip-row"><span class="ip-k">Genre</span><span class="ip-v"><div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${genre.map(g => `<span class="gp">${escHtml(g)}</span>`).join('')}</div></span></div>
      <div class="ip-row"><span class="ip-k">Duration</span><span class="ip-v">${escHtml(duration)}</span></div>
      <div class="ip-row"><span class="ip-k">Release</span><span class="ip-v">${escHtml(releaseDate)}</span></div>
      <div class="ip-row"><span class="ip-k">Certificate</span><span class="ip-v">${escHtml(certificate)}</span></div>
      <div class="ip-row"><span class="ip-k">Formats</span><span class="ip-v">${escHtml(formats.join(', '))}</span></div>
    `;
  }

  if (mvBoxOffice) {
    mvBoxOffice.innerHTML = boxOffice ? `
      <div class="ip-title">💰 Box Office</div>
      <div class="ip-row"><span class="ip-k">Opening Day</span><span class="ip-v">${escHtml(boxOffice.opening || '—')}</span></div>
      <div class="ip-row"><span class="ip-k">Weekend</span><span class="ip-v">${escHtml(boxOffice.weekend || '—')}</span></div>
      <div class="ip-row"><span class="ip-k">Total</span><span class="ip-v">${escHtml(boxOffice.total || '—')}</span></div>
      <div class="ip-row"><span class="ip-k">Budget</span><span class="ip-v">${escHtml(boxOffice.budget || '—')}</span></div>
    ` : `
      <div class="ip-title">💰 Box Office</div>
      <p style="font-size:.78rem;color:var(--mt);padding:6px 0">Not yet released</p>
    `;
  }

  renderPriceTrend();
  bindQuickBook();
  bindWishlist(_id);
  bindShare(title);
  bindTrailer(title);
  bindRating(title, _id);
  bindCommentStars();
  loadComments(_id);

  const user = getCurrentUser();
  const av = document.getElementById('commentAvatar');
  if (av) {
    av.textContent = user?.name ? user.name[0].toUpperCase() : '?';
  }

  const postBtn = document.getElementById('postCommentBtn');
  if (postBtn) {
    postBtn.onclick = window.postComment;
  }
}

function bindQuickBook() {
  const qbBtn = document.getElementById('qbBtn');
  if (!qbBtn) return;

  qbBtn.onclick = () => {
    const l = document.getElementById('qbLang')?.value || '';
    const f = document.getElementById('qbFmt')?.value || '';

    if (l.startsWith('Select') || f.startsWith('Select')) {
      toast('Select language and format first', 'warn');
      return;
    }

    document.getElementById('showtimes')?.scrollIntoView({ behavior: 'smooth' });
  };
}

function isWishlistedCompat(movieId) {
  if (typeof isWishlisted === 'function') {
    try {
      return isWishlisted(movieId);
    } catch (_) {}
  }

  try {
    const list = JSON.parse(localStorage.getItem('mz_wishlist') || '[]');
    return list.includes(movieId);
  } catch (_) {
    return false;
  }
}

function toggleWishlistCompat(movieId) {
  if (typeof toggleWishlistItem === 'function') return toggleWishlistItem(movieId);
  if (typeof toggleWL === 'function') return toggleWL(movieId);

  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('mz_wishlist') || '[]');
  } catch (_) {
    list = [];
  }

  if (list.includes(movieId)) {
    list = list.filter(x => x !== movieId);
  } else {
    list.push(movieId);
  }

  localStorage.setItem('mz_wishlist', JSON.stringify(list));
}

function bindWishlist(movieId) {
  const wlBtn = document.getElementById('mvWLBtn');
  if (!wlBtn) return;

  const updateWL = () => {
    const on = isWishlistedCompat(movieId);
    wlBtn.textContent = on ? '❤️' : '🤍';
    wlBtn.classList.toggle('wl-on', on);
  };

  updateWL();
  wlBtn.onclick = () => {
    toggleWishlistCompat(movieId);
    updateWL();
  };
}

function bindShare(title) {
  const btn = document.getElementById('mvShareBtn');
  if (!btn) return;

  btn.onclick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: location.href });
      } catch (_) {}
      return;
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(location.href);
        toast('Link copied!', 'success');
      } catch (_) {
        prompt('Copy this link:', location.href);
      }
      return;
    }

    prompt('Copy this link:', location.href);
  };
}

function bindTrailer(title) {
  const btn = document.getElementById('mvTrailerBtn');
  if (!btn) return;

  btn.onclick = () => {
    toast('🎬 Opening Trailer Player...', 'info');
    setTimeout(() => {
      window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`,
        '_blank'
      );
    }, 400);
  };
}

function bindRating(title, movieId) {
  const labels = ['', 'Terrible', 'Very Bad', 'Bad', 'Poor', 'Average', 'Good', 'Very Good', 'Great', 'Excellent', 'Masterpiece! 🔥'];

  const rateBg = document.getElementById('rateBg');
  const mvRateBtn = document.getElementById('mvRateBtn');
  const mvRatingPill = document.getElementById('mvRatingPill');
  const rateCancel = document.getElementById('rateCancel');
  const rateSub = document.getElementById('rateSub');
  const rateLbl = document.getElementById('rateLbl');
  const rateSubmit = document.getElementById('rateSubmit');

  if (!rateBg) return;

  const openRate = () => rateBg.classList.add('open');

  mvRateBtn?.addEventListener('click', openRate);
  mvRatingPill?.addEventListener('click', openRate);
  rateCancel?.addEventListener('click', () => rateBg.classList.remove('open'));

  rateBg.addEventListener('click', e => {
    if (e.target.id === 'rateBg') rateBg.classList.remove('open');
  });

  if (rateSub) rateSub.textContent = `How was ${title}?`;

  document.querySelectorAll('.s-btn').forEach(b => {
    b.addEventListener('click', () => {
      selectedRating = parseInt(b.dataset.v, 10);
      document.querySelectorAll('.s-btn').forEach(x => {
        x.classList.toggle('lit', parseInt(x.dataset.v, 10) <= selectedRating);
      });
      if (rateLbl) rateLbl.textContent = labels[selectedRating] || 'Tap a star to rate';
    });
  });

  rateSubmit?.addEventListener('click', () => {
    if (!selectedRating) {
      toast('Please select a rating first', 'warn');
      return;
    }

    try {
      const all = JSON.parse(localStorage.getItem('mz_ratings') || '{}');
      all[movieId] = {
        rating: selectedRating,
        title,
        at: new Date().toISOString()
      };
      localStorage.setItem('mz_ratings', JSON.stringify(all));
    } catch (_) {}

    toast(`You rated this movie ${selectedRating}/10`, 'success');
    rateBg.classList.remove('open');
  });
}

function bindCommentStars() {
  document.querySelectorAll('.comment-star').forEach(s => {
    s.addEventListener('click', () => {
      commentRating = parseInt(s.dataset.v, 10);
      document.querySelectorAll('.comment-star').forEach(x => {
        x.style.color = parseInt(x.dataset.v, 10) <= commentRating
          ? 'var(--gold)'
          : 'rgba(255,255,255,.2)';
      });
    });
  });
}

function getStoredComments(movieId) {
  try {
    const all = JSON.parse(localStorage.getItem('mz_comments') || '{}');
    return Array.isArray(all[movieId]) ? all[movieId] : [];
  } catch (_) {
    return [];
  }
}

function saveStoredComments(movieId, comments) {
  try {
    const all = JSON.parse(localStorage.getItem('mz_comments') || '{}');
    all[movieId] = comments;
    localStorage.setItem('mz_comments', JSON.stringify(all));
  } catch (_) {}
}

function renderCommentsList(movieId) {
  const listEl = document.getElementById('commentsList');
  if (!listEl) return;

  const comments = getStoredComments(movieId);

  if (!comments.length) {
    listEl.innerHTML = `
      <div class="comment-card">
        <div class="comment-text">No reviews yet. Be the first one to post! 🎬</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = comments.map((c, idx) => {
    const userName = c.user || c.name || 'User';
    const ratingBadge = c.rating ? `<div class="comment-rating-badge">★ ${escHtml(String(c.rating))}/5</div>` : '';

    return `
      <div class="comment-card">
        <div class="comment-header">
          <div class="comment-user-av">${escHtml(userName.charAt(0).toUpperCase())}</div>
          <div>
            <div class="comment-user-name">${escHtml(userName)}</div>
            <div class="comment-time">${escHtml(c.time || 'Just now')}</div>
          </div>
          ${ratingBadge}
        </div>

        <div class="comment-text">${escHtml(c.text || '')}</div>

        <div class="comment-actions">
          <button class="comment-like-btn ${c.liked ? 'liked' : ''}" onclick="likeComment(${idx})">
            ❤️ <span>${safeNum(c.likes, 0)}</span>
          </button>
          <button class="comment-like-btn" onclick="replyComment('${escAttr(userName)}')">
            💬 Reply
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function loadComments(movieId) {
  renderCommentsList(movieId);
}

window.postComment = function () {
  const movieId = safeText(movieData?._id, getMovieIdFromURL());
  if (!movieId) return;

  if (!isUserLoggedIn()) {
    toast('Please login to post a review', 'warn');
    location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
    return;
  }

  const input = document.getElementById('commentInput');
  if (!input) return;

  const text = safeText(input.value, '').trim();
  if (!text) {
    toast('Write something first', 'warn');
    return;
  }

  const user = getCurrentUser();
  const comments = getStoredComments(movieId);

  comments.unshift({
    user: safeText(user?.name, 'User'),
    text,
    rating: commentRating || 0,
    likes: 0,
    liked: false,
    time: 'Just now',
    at: new Date().toISOString()
  });

  saveStoredComments(movieId, comments);

  input.value = '';
  commentRating = 0;

  document.querySelectorAll('.comment-star').forEach(x => {
    x.style.color = 'rgba(255,255,255,.2)';
  });

  renderCommentsList(movieId);
  toast('Review posted successfully!', 'success');
};

window.likeComment = function (idx) {
  const movieId = safeText(movieData?._id, getMovieIdFromURL());
  if (!movieId) return;

  const comments = getStoredComments(movieId);
  if (!comments[idx]) return;

  comments[idx].liked = !comments[idx].liked;
  comments[idx].likes = comments[idx].liked
    ? safeNum(comments[idx].likes, 0) + 1
    : Math.max(0, safeNum(comments[idx].likes, 0) - 1);

  saveStoredComments(movieId, comments);
  renderCommentsList(movieId);
};

window.replyComment = function (user) {
  toast(`Replying to ${user}... (Feature coming soon!)`, 'info');
};

window.selDate = function (btn, date) {
  document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  window._selDate = date;
};

window.handleShowClick = function (movieId, cinema, time, format, language = '') {
  if (!isUserLoggedIn()) {
    location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
    return;
  }

  if (typeof showSeatCountPopup === 'function') {
    showSeatCountPopup(movieId, cinema, time, window._selDate || 'Today', format, language);
  } else {
    let url =
      `booking.html?id=${encodeURIComponent(movieId)}` +
      `&cinema=${encodeURIComponent(cinema)}` +
      `&time=${encodeURIComponent(time)}` +
      `&date=${encodeURIComponent(window._selDate || 'Today')}` +
      `&format=${encodeURIComponent(format)}`;

    if (language) {
      url += `&language=${encodeURIComponent(language)}`;
    }

    location.href = url;
  }
};

window.findBuddy = function () {
  if (!isUserLoggedIn()) {
    toast('Login to find a movie buddy!', 'warn');
    return;
  }

  toast('🎬 Finding movie buddies for your show... (Feature coming soon!)', 'info');
};

window.showPriceTrendTip = function () {
  toast('Weekend shows usually cost more. Book early for best prices!', 'info');
};

async function initMovieDetailPage() {
  try {
    if (typeof mountNavbar === 'function') {
      mountNavbar('movie');
    }

    if (typeof initNavSearch === 'function') {
      setTimeout(() => initNavSearch(), 50);
    }

    const id = getMovieIdFromURL();
    if (!id) {
      location.href = 'index.html';
      return;
    }

    if (!window.API || typeof API.get !== 'function') {
      throw new Error('API not available');
    }

    const data = await API.get(`/movies/${id}`);
    if (!data || !data.success || !data.movie) {
      location.href = 'index.html';
      return;
    }

    movieData = data.movie;
    renderDates();
    renderMovie(movieData);

    const loader = document.getElementById('pageLoader');
    if (loader) {
      setTimeout(() => loader.classList.add('gone'), 400);
    }
  } catch (err) {
    console.error('initMovieDetailPage error:', err);
    toast('Error: ' + (err?.message || 'Something went wrong'), 'error');
  }
}

document.addEventListener('DOMContentLoaded', initMovieDetailPage);