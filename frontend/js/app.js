// js/app.js

const CITIES = [
  { n: 'Mumbai', i: '🏙️' },
  { n: 'Delhi-NCR', i: '🕌' },
  { n: 'Bengaluru', i: '🌿' },
  { n: 'Hyderabad', i: '🏛️' },
  { n: 'Chennai', i: '🏖️' },
  { n: 'Kolkata', i: '🌉' },
  { n: 'Pune', i: '🏔️' },
  { n: 'Ahmedabad', i: '🏗️' },
  { n: 'Jaipur', i: '🕍' },
  { n: 'Kochi', i: '⛵' }
];

function hideLoader() {
  const l = document.getElementById('pageLoader');
  if (l) {
    setTimeout(() => l.classList.add('gone'), 700);
  }
}

// page load pe saved theme apply
(function applySavedTheme() {
  const isDark = localStorage.getItem('mz_dark') !== 'false';
  if (!isDark) {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.classList.add('light');
    });
  }
})();

function mountNavbar(active) {
  const el = document.getElementById('navMount');
  if (!el) return;

  const user = SESSION.getUser();
  const city = localStorage.getItem('mz_city') || 'Mumbai';
  const pts = parseInt(localStorage.getItem('mz_pts') || '0', 10);
  const tier = pts >= 1000 ? 'Platinum' : pts >= 500 ? '🥇 Gold' : '🥈 Silver';

  el.innerHTML = `
    <nav class="navbar" id="mainNavbar">
      <a href="index.html" class="nav-logo">BookMyShow</a>

      <div class="nav-search-wrap">
        <div class="nav-search-box">
          <span class="nav-search-ico">🔍</span>
          <input
            type="text"
            id="navSearch"
            class="nav-search-inp"
            placeholder="Search movies, events..."
            autocomplete="off"
          >
          <button class="voice-mic-btn" id="navMicBtn" title="Voice Search">🎤</button>
        </div>

        <div class="voice-listening-text" id="voiceListeningText">
          <div class="voice-wave">
            <span></span><span></span><span></span><span></span>
          </div>
          Listening...
        </div>

        <div class="search-dd" id="searchDd"></div>
      </div>

      <ul class="nav-links">
        <li><a href="index.html" class="nav-link ${active === 'home' ? 'active' : ''}">Movies</a></li>
        <li><a href="events.html" class="nav-link ${active === 'events' ? 'active' : ''}">Events</a></li>
        <li><a href="profile.html" class="nav-link ${active === 'profile' ? 'active' : ''}">Profile</a></li>
      </ul>

      <div class="nav-right">
        <div class="city-btn" id="cityBtn">📍 ${city} ▾</div>
        <button class="btn-theme" id="themeBtn" title="Toggle theme">🌙</button>
        <button class="btn-notif" id="notifBtn" title="Notifications">
          <span>🔔</span>
          <span class="notif-dot"></span>
        </button>

        ${
          user
            ? `
          <div class="nav-user-wrap">
            <button class="nav-user-btn" id="navUserBtn">
              <div class="nav-av">${(user.name || 'U')[0].toUpperCase()}</div>
              <span>${(user.name || 'User').split(' ')[0]}</span>
              <span style="font-size:.65rem;color:rgba(255,255,255,.5)">▾</span>
            </button>

            <div class="user-dd" id="userDd">
              <div class="reward-mini-card">
                <div class="reward-mini-top">
                  <div>
                    <div class="reward-mini-title">🏆 My Rewards</div>
                    <div class="reward-mini-points" id="ddPoints">${pts.toLocaleString('en-IN')}</div>
                    <div class="reward-mini-sub">Loyalty Points</div>
                  </div>
                  <div class="reward-mini-badge">${tier}</div>
                </div>

                <div class="reward-mini-progress">
                  <div
                    class="reward-mini-fill"
                    style="width:${Math.min(100, Math.round((pts / 1000) * 100))}%"
                  ></div>
                </div>

                <div class="reward-mini-meta">
                  <span>${pts} / 1000 pts to Platinum</span>
                  <span>Redeem →</span>
                </div>
              </div>

              <a href="profile.html">👤 My Profile</a>
              <a href="profile.html#bookings">🎟 My Bookings</a>
              <a href="profile.html#wishlist">❤️ Wishlist</a>
              <a href="profile.html#rewards">🏆 Rewards</a>
              <div class="dd-sep"></div>
              <button id="logoutBtn">🚪 Sign Out</button>
            </div>
          </div>
        `
            : `<a href="login.html" class="btn-signin-nav">Sign In</a>`
        }
      </div>
    </nav>

    <div class="city-overlay" id="cityOverlay">
      <div class="city-popup">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3>📍 Select Your City</h3>
          <button
            type="button"
            onclick="document.getElementById('cityOverlay').classList.remove('open')"
            style="color:var(--mt);font-size:1.2rem"
          >✕</button>
        </div>

        <input
          type="text"
          class="city-search-inp"
          id="citySearchInp"
          placeholder="Search for your city..."
        >

        <div class="city-detect" onclick="detectMyCity()">📡 Detect my location</div>

        <div style="font-size:.74rem;color:var(--mt);font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px">
          Popular Cities
        </div>

        <div class="cities-grid" id="citiesGrid"></div>

        <div class="view-all-btn" onclick="TOAST.show('More cities coming soon!','info')">
          View All Cities ›
        </div>
      </div>
    </div>
  `;

  // scroll navbar solid
  window.addEventListener('scroll', () => {
    document.getElementById('mainNavbar')?.classList.toggle('scrolled', window.scrollY > 80);
  });

  // theme
  const themeBtn = document.getElementById('themeBtn');
  const isDark = localStorage.getItem('mz_dark') !== 'false';

  if (!isDark) {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }

  if (themeBtn) {
    themeBtn.textContent = isDark ? '☀️' : '🌙';

    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light');
      const light = document.body.classList.contains('light');
      localStorage.setItem('mz_dark', light ? 'false' : 'true');
      themeBtn.textContent = light ? '🌙' : '☀️';
    });
  }

  // user dropdown
  const uBtn = document.getElementById('navUserBtn');
  const uDd = document.getElementById('userDd');

  if (uBtn && uDd) {
    uBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      uDd.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      uDd.classList.remove('open');
    });
  }

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    SESSION.clear();
    TOAST.show('Logged out!', 'info');
    setTimeout(() => {
      location.href = 'index.html';
    }, 500);
  });

  // notifications
  document.getElementById('notifBtn')?.addEventListener('click', () => {
    TOAST.show('No new notifications', 'info');
  });

  // city popup
  const cityBtn = document.getElementById('cityBtn');
  if (cityBtn) {
    cityBtn.addEventListener('click', () => {
      renderCitiesGrid(CITIES);
      document.getElementById('cityOverlay')?.classList.add('open');
    });
  }

  document.getElementById('cityOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'cityOverlay') {
      e.target.classList.remove('open');
    }
  });

  document.getElementById('citySearchInp')?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = q
      ? CITIES.filter((c) => c.n.toLowerCase().includes(q))
      : CITIES;

    renderCitiesGrid(filtered);
  });

  // voice search
  document.getElementById('navMicBtn')?.addEventListener('click', () => {
    if (typeof openVoiceModal === 'function') {
      openVoiceModal();
    } else if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      startNavbarVoiceSearch();
    } else {
      TOAST.show('Voice search is not supported in this browser', 'warn');
    }
  });

  // navbar search
  initNavSearch();

  // update loyalty points from server
  if (user) {
    API.get('/auth/me')
      .then((d) => {
        if (d.success && d.user) {
          const freshPts = d.user.loyaltyPoints || 0;
          localStorage.setItem('mz_pts', freshPts);

          const pointsEl = document.getElementById('ddPoints');
          if (pointsEl) {
            pointsEl.textContent = freshPts.toLocaleString('en-IN');
          }

          const badgeEl = document.querySelector('.reward-mini-badge');
          if (badgeEl) {
            badgeEl.textContent =
              freshPts >= 1000 ? 'Platinum' : freshPts >= 500 ? '🥇 Gold' : '🥈 Silver';
          }

          const fillEl = document.querySelector('.reward-mini-fill');
          if (fillEl) {
            fillEl.style.width = `${Math.min(100, Math.round((freshPts / 1000) * 100))}%`;
          }

          const metaEl = document.querySelector('.reward-mini-meta span');
          if (metaEl) {
            metaEl.textContent = `${freshPts} / 1000 pts to Platinum`;
          }
        }
      })
      .catch(() => {});
  }
}

function renderCitiesGrid(list) {
  const cur = localStorage.getItem('mz_city') || 'Mumbai';
  const g = document.getElementById('citiesGrid');
  if (!g) return;

  g.innerHTML = list.map((c) => `
    <div class="city-item ${c.n === cur ? 'active' : ''}" onclick="setCity('${c.n.replace(/'/g, "\\'")}')">
      <div class="city-ico">${c.i}</div>
      <div class="city-nm">${c.n}</div>
    </div>
  `).join('');
}

window.setCity = function (city) {
  localStorage.setItem('mz_city', city);
  document.getElementById('cityOverlay')?.classList.remove('open');

  const btn = document.getElementById('cityBtn');
  if (btn) {
    btn.textContent = `📍 ${city} ▾`;
  }

  TOAST.show(`City changed to ${city}`, 'success');
};

window.detectMyCity = function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      () => setCity('Mumbai'),
      () => TOAST.show('Location denied', 'error')
    );
  } else {
    TOAST.show('Geolocation not supported', 'warn');
  }
};

// search
function initNavSearch() {
  const inp = document.getElementById('navSearch');
  const dd = document.getElementById('searchDd');
  if (!inp || !dd) return;

  let timer;

  inp.addEventListener('input', () => {
    clearTimeout(timer);
    const q = inp.value.trim();

    if (!q) {
      dd.classList.remove('show');
      dd.innerHTML = '';
      return;
    }

    timer = setTimeout(async () => {
      try {
        const data = await API.get(`/movies/search?q=${encodeURIComponent(q)}`);

        if (!data.movies?.length) {
          dd.classList.remove('show');
          dd.innerHTML = '';
          return;
        }

        dd.innerHTML = data.movies.map((m) => `
          <div class="sd-item" onclick="location.href='movie.html?id=${m._id}'">
            <span class="sd-emoji">${
              typeof m.poster === 'string' && (m.poster.startsWith('http') || m.poster.startsWith('/'))
                ? `<img src="${m.poster}" alt="${m.title}" style="width:40px;height:56px;object-fit:cover;border-radius:8px;">`
                : (m.poster || '🎬')
            }</span>
            <div>
              <div class="sd-title">${m.title || 'Untitled'}</div>
              <div class="sd-genre">${(m.genre || []).join(' · ')} · ★ ${m.rating || 'N/A'}</div>
            </div>
          </div>
        `).join('');

        dd.classList.add('show');
      } catch (err) {
        dd.classList.remove('show');
        dd.innerHTML = '';
      }
    }, 300);
  });

  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dd.classList.remove('show');
    }

    if (e.key === 'Enter' && inp.value.trim()) {
      location.href = `search.html?q=${encodeURIComponent(inp.value.trim())}`;
    }
  });

  document.addEventListener('click', (e) => {
    const wrap = inp.closest('.nav-search-wrap');
    if (wrap && !wrap.contains(e.target)) {
      dd.classList.remove('show');
    }
  });
}

// basic voice search fallback
function startNavbarVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    TOAST.show('Voice search not supported', 'warn');
    return;
  }

  const recognition = new SpeechRecognition();
  const inp = document.getElementById('navSearch');
  const listeningText = document.getElementById('voiceListeningText');

  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  if (listeningText) {
    listeningText.classList.add('show');
  }

  recognition.start();

  recognition.onresult = function (event) {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
    if (inp && transcript) {
      inp.value = transcript;
      inp.dispatchEvent(new Event('input'));
    }
    TOAST.show(`You said: ${transcript}`, 'success');
  };

  recognition.onerror = function () {
    TOAST.show('Voice search failed. Try again.', 'error');
  };

  recognition.onend = function () {
    if (listeningText) {
      listeningText.classList.remove('show');
    }
  };
}

// wishlist
function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem('mz_wish') || '[]');
  } catch {
    return [];
  }
}

function isWishlisted(id) {
  return getWishlist().includes(String(id));
}

async function toggleWL(id, btn) {
  if (!SESSION.isLoggedIn()) {
    TOAST.show('Please login to add to wishlist', 'warn');
    return false;
  }

  const list = getWishlist();
  const sid = String(id);
  const idx = list.indexOf(sid);
  let added = false;

  if (idx === -1) {
    list.push(sid);
    added = true;
    TOAST.show('Added to wishlist ❤️', 'success');
  } else {
    list.splice(idx, 1);
    added = false;
    TOAST.show('Removed from wishlist', 'info');
  }

  localStorage.setItem('mz_wish', JSON.stringify(list));

  if (btn) {
    btn.textContent = added ? '❤️' : '🤍';
    btn.classList.toggle('on', added);
  }

  try {
    await API.post(`/auth/wishlist/${id}`);
  } catch {}

  return added;
}

document.addEventListener('DOMContentLoaded', hideLoader);