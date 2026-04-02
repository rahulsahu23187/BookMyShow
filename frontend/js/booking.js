// js/booking.js — Final Fixed & Upgraded
// Stable seat booking + food pre-order + countdown + split bill + safer fallbacks

const SEAT_CATS = [
  { rows: ['L', 'K'], label: 'RECLINER ROWS', key: 'recliner', color: '#f5c518' },
  { rows: ['J', 'I', 'H'], label: 'PRIME PLUS ROWS', key: 'premium', color: '#a855f7' },
  { rows: ['G', 'F', 'E', 'D'], label: 'PRIME ROWS', key: 'regular', color: '#3b82f6' },
  { rows: ['C', 'B', 'A'], label: 'CLASSIC ROWS', key: 'economy', color: '#22c55e' }
];

let selSeats = [];
let curMovieId = null;
let curPrices = {};
let curShow = {};
let cdTimer = null;
let secsLeft = 300;
let bookingBooted = false;

var foodCart = window.foodCart || {};
window.foodCart = foodCart;

const FOOD_MENU = [
  { id: 'popcorn',  name: 'Popcorn (Large)', desc: 'Classic butter popcorn', price: 180, emoji: '🍿', popular: true },
  { id: 'coke',     name: 'Coke (500ml)',    desc: 'Chilled soft drink',     price: 120, emoji: '🥤' },
  { id: 'nachos',   name: 'Nachos + Dip',    desc: 'Crispy nachos combo',    price: 200, emoji: '🧂' },
  { id: 'combo1',   name: 'Combo 1',         desc: 'Popcorn + Coke combo',   price: 280, emoji: '🎬', popular: true },
  { id: 'icecream', name: 'Ice Cream',       desc: 'Vanilla cup',            price: 100, emoji: '🍦' }
];

window.FOOD_ITEMS = window.FOOD_ITEMS || FOOD_MENU;

/* ───────────────── helpers ───────────────── */

function byId(id) {
  return document.getElementById(id);
}

function firstEl(ids) {
  for (const id of ids) {
    const el = byId(id);
    if (el) return el;
  }
  return null;
}

function allExisting(ids) {
  return ids.map(byId).filter(Boolean);
}

function safeSeatSelector(sid) {
  const raw = String(sid || '');
  const safeId =
    typeof CSS !== 'undefined' && CSS.escape
      ? CSS.escape(raw)
      : raw.replace(/"/g, '\\"');
  return `.seat[data-sid="${safeId}"]`;
}

function toast(msg, type = 'info') {
  try {
    if (typeof TOAST !== 'undefined' && TOAST && typeof TOAST.show === 'function') {
      TOAST.show(msg, type);
      return;
    }
  } catch (err) {
    console.warn('TOAST failed:', err);
  }

  console.log(`[${type}] ${msg}`);
}

function safeMountNavbar() {
  try {
    if (typeof mountNavbar === 'function') {
      mountNavbar('movie');
    }
  } catch (err) {
    console.warn('mountNavbar failed:', err);
  }
}

function safeHideLoader(force = false) {
  const loader = byId('pageLoader');
  if (!loader) return;

  try {
    if (!force && typeof hideLoader === 'function') {
      hideLoader();
      return;
    }
  } catch (err) {
    console.warn('hideLoader failed:', err);
  }

  loader.classList.add('gone');
  loader.style.opacity = '0';
  loader.style.pointerEvents = 'none';
  loader.style.display = 'none';
}

function parseShowHour(time) {
  const raw = String(time || '').trim().toLowerCase();
  const m = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return 12;

  let hour = parseInt(m[1], 10);
  const mer = (m[3] || '').toLowerCase();

  if (mer === 'pm' && hour !== 12) hour += 12;
  if (mer === 'am' && hour === 12) hour = 0;

  return hour;
}

function safeDecode(v, fallback = '') {
  try {
    return decodeURIComponent(v || fallback);
  } catch {
    return v || fallback;
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getMoviePayload(data) {
  if (!data) return null;
  if (data.movie) return data.movie;
  if (data.data?.movie) return data.data.movie;
  if (data.data) return data.data;
  return null;
}

function renderFatalState(message) {
  const grid = firstEl(['seatMap', 'seatGrid']);
  const html = `
    <div style="
      padding:24px;
      border:1px solid rgba(255,255,255,.08);
      border-radius:16px;
      background:rgba(255,255,255,.03);
      color:#fff;
      text-align:center;
      max-width:720px;
      margin:24px auto;
    ">
      <div style="font-size:2rem;margin-bottom:10px">⚠️</div>
      <h3 style="margin:0 0 8px 0">Unable to load booking page</h3>
      <p style="margin:0 0 16px 0;color:#aaa">${escapeHtml(message || 'Something went wrong.')}</p>
      <button onclick="location.href='index.html'" style="
        padding:10px 16px;
        border:none;
        border-radius:10px;
        cursor:pointer;
        font-weight:700;
      ">Go Home</button>
    </div>
  `;

  if (grid) {
    grid.innerHTML = html;
  } else {
    document.body.insertAdjacentHTML('beforeend', html);
  }

  safeHideLoader(true);
}

function getCrowdLevel(time) {
  const h = parseShowHour(time);

  if (h >= 20 || h <= 12) {
    return { level: 'high', label: '🔴 Housefull Vibes', color: '#ef4444' };
  }
  if (h >= 16) {
    return { level: 'medium', label: '🟡 Filling Fast', color: '#f59e0b' };
  }
  return { level: 'low', label: '🟢 Low Crowd — Good Time!', color: '#22c55e' };
}

function normalizePrices(prices) {
  const p = prices && typeof prices === 'object' ? prices : {};
  return {
    recliner: Number(p.recliner) || 500,
    premium: Number(p.premium) || 350,
    regular: Number(p.regular) || 250,
    economy: Number(p.economy) || 180
  };
}

/* ───────────────── storage keys ───────────────── */

function bKey(m, sk) { return `bk_${m}_${sk}`; }
function lKey(m, sk) { return `lk_${m}_${sk}`; }
function sKey(c, t, d) { return `${c}|||${t}|||${d}`.replace(/\s/g, '_'); }

/* ───────────────── seat state helpers ───────────────── */

function getBooked(mId, sk) {
  try {
    const parsed = JSON.parse(localStorage.getItem(bKey(mId, sk)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getLocked(mId, sk) {
  try {
    const raw = JSON.parse(localStorage.getItem(lKey(mId, sk)) || '{}');
    const now = Date.now();
    const clean = {};
    let changed = false;

    Object.entries(raw).forEach(([seat, ts]) => {
      if (typeof ts === 'number' && now - ts < 5 * 60 * 1000) {
        clean[seat] = ts;
      } else {
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem(lKey(mId, sk), JSON.stringify(clean));
    }

    return Object.keys(clean);
  } catch {
    return [];
  }
}

function lockSeat(mId, sk, sid) {
  try {
    const raw = JSON.parse(localStorage.getItem(lKey(mId, sk)) || '{}');
    raw[sid] = Date.now();
    localStorage.setItem(lKey(mId, sk), JSON.stringify(raw));
  } catch (err) {
    console.error('lockSeat error:', err);
  }
}

function unlockSeat(mId, sk, sid) {
  try {
    const raw = JSON.parse(localStorage.getItem(lKey(mId, sk)) || '{}');
    delete raw[sid];
    localStorage.setItem(lKey(mId, sk), JSON.stringify(raw));
  } catch (err) {
    console.error('unlockSeat error:', err);
  }
}

function unlockAllSelectedSeats() {
  if (!curMovieId || !curShow.cinema) return;
  const sk = sKey(curShow.cinema, curShow.time, curShow.date);
  selSeats.forEach(sid => unlockSeat(curMovieId, sk, sid));
}

async function fetchServerBooked(movieId, sk) {
  try {
    if (!window.API || typeof API.get !== 'function') {
      return [];
    }

    const d = await API.get(`/movies/seats/${movieId}/${encodeURIComponent(sk)}`);

    if (d && d.success && Array.isArray(d.bookedSeats)) {
      const existing = getBooked(movieId, sk);
      const merged = [...new Set([...existing, ...d.bookedSeats])];
      localStorage.setItem(bKey(movieId, sk), JSON.stringify(merged));
      return merged;
    }

    return [];
  } catch (err) {
    console.warn('fetchServerBooked failed:', err?.message || err);
    return [];
  }
}

/* ───────────────── crowd ui ───────────────── */

function setCrowdUI(crowd) {
  const crowdLevel = byId('crowdLevel');
  const crowdInfo = byId('crowdInfo');
  const crowdPill = byId('crowdPill');

  if (crowdLevel) {
    crowdLevel.innerHTML = `<span style="color:${crowd.color};font-weight:700">${escapeHtml(crowd.label)}</span>`;
    crowdLevel.style.borderColor = `${crowd.color}44`;
  }

  if (crowdInfo) {
    crowdInfo.textContent =
      crowd.level === 'high'
        ? 'This show is getting packed. Better seats may sell out quickly.'
        : crowd.level === 'medium'
          ? 'Seats are moving at a decent pace. Good options still available.'
          : 'Low crowd right now. Good time to book calmly.';
  }

  if (crowdPill) {
    crowdPill.textContent = crowd.label;
    crowdPill.style.borderColor = `${crowd.color}44`;
    crowdPill.style.color = crowd.color;
  }
}

/* ───────────────── seat grid rendering ───────────────── */

function getSeatGridEl() {
  return firstEl(['seatMap', 'seatGrid']);
}

function seatCellHTML(sid, price, booked, locked, isBest) {
  const isSelected = selSeats.includes(sid);
  let cls = 'available';

  if (booked.includes(sid)) cls = 'booked';
  else if (locked.includes(sid) && !isSelected) cls = 'filling';
  else if (isSelected) cls = 'selected';
  else if (isBest) cls = 'bestseller';

  const seatNum = sid.replace(/[A-Z]/g, '');

  return `
    <div
      class="seat ${cls}"
      data-sid="${escapeHtml(sid)}"
      data-price="${Number(price) || 0}"
      onclick="toggleSeat('${String(sid).replace(/'/g, "\\'")}', ${Number(price) || 0})"
      title="${escapeHtml(sid)}${isBest ? ' ⭐' : ''}">
      ${escapeHtml(seatNum)}
    </div>
  `;
}

function renderSeatGridFallback(movieId, cinema, time, date, format, prices, booked, locked) {
  const grid = getSeatGridEl();
  if (!grid) return;

  let html = '';

  SEAT_CATS.forEach(cat => {
    const price = Number(prices[cat.key]) || 250;

    html += `
      <div style="margin-bottom:18px">
        <div style="margin-bottom:10px;font-weight:700;color:${cat.color};font-size:.86rem">
          ${escapeHtml(cat.label)} — ₹${price}
        </div>
    `;

    cat.rows.forEach(row => {
      const cols = (row === 'L' || row === 'K') ? 8 : 12;

      html += `<div class="seat-row"><div class="row-lbl">${escapeHtml(row)}</div>`;

      for (let c = 1; c <= cols; c++) {
        const sid = `${row}${c}`;
        const isBest = ['G', 'F', 'E'].includes(row) && c >= 4 && c <= 9;
        html += seatCellHTML(sid, price, booked, locked, isBest);
      }

      for (let extra = cols + 1; extra <= 14; extra++) {
        html += `<div></div>`;
      }

      html += `</div>`;
    });

    html += `</div>`;
  });

  grid.innerHTML = html;
}

async function renderSeatGrid(movieId, cinema, time, date, format, prices) {
  curMovieId = movieId;
  curPrices = normalizePrices(prices);
  curShow = { cinema, time, date, format };

  const sk = sKey(cinema, time, date);
  const grid = getSeatGridEl();
  if (!grid) return;

  const crowd = getCrowdLevel(time);
  setCrowdUI(crowd);

  const booked = getBooked(movieId, sk);
  const locked = getLocked(movieId, sk);

  renderSeatGridFallback(movieId, cinema, time, date, format, curPrices, booked, locked);
  updatePanel();

  try {
    const serverBooked = await fetchServerBooked(movieId, sk);
    const latestBooked = [...new Set([...(serverBooked || []), ...getBooked(movieId, sk)])];
    const latestLocked = getLocked(movieId, sk);

    renderSeatGridFallback(movieId, cinema, time, date, format, curPrices, latestBooked, latestLocked);
    updatePanel();
  } catch (err) {
    console.warn('Background booked-seat sync failed:', err);
  }
}

/* ───────────────── seat toggle ───────────────── */

window.toggleSeat = function (sid, price) {
  const el = document.querySelector(safeSeatSelector(sid));
  if (!el) return;

  if (el.classList.contains('booked') || el.classList.contains('filling')) {
    toast('Seat unavailable', 'error');
    return;
  }

  const sk = sKey(curShow.cinema, curShow.time, curShow.date);
  const idx = selSeats.indexOf(sid);

  if (idx === -1) {
    if (selSeats.length >= 10) {
      toast('Max 10 seats per booking', 'warn');
      return;
    }

    selSeats.push(sid);
    el.classList.add('selected');
    el.classList.remove('bestseller');
    lockSeat(curMovieId, sk, sid);
  } else {
    selSeats.splice(idx, 1);
    el.classList.remove('selected');

    if (
      ['G', 'F', 'E'].includes(sid[0]) &&
      parseInt(sid.slice(1), 10) >= 4 &&
      parseInt(sid.slice(1), 10) <= 9
    ) {
      el.classList.add('bestseller');
    } else {
      el.classList.remove('bestseller');
      el.classList.add('available');
    }

    unlockSeat(curMovieId, sk, sid);
  }

  updatePanel();
};

/* ───────────────── food menu ───────────────── */

function renderFoodCards() {
  const grid = byId('foodCardsGrid');
  if (!grid) return;

  grid.innerHTML = FOOD_MENU.map(item => {
    const qty = foodCart[item.id] || 0;

    return `
      <div class="food-card-item">
        <div class="food-card-img">
          ${item.popular ? '<div class="food-popular-tag">⭐ POPULAR</div>' : ''}
          ${escapeHtml(item.emoji || '🍿')}
        </div>
        <div class="food-card-body">
          <div class="food-card-name">${escapeHtml(item.name || 'Item')}</div>
          <div class="food-card-desc">${escapeHtml(item.desc || 'Tasty snack')}</div>
          <div class="food-card-price">₹${Number(item.price) || 0}</div>
          <div class="food-card-actions">
            <div class="food-qty-wrap">
              <button class="food-qty-btn" type="button" onclick="changeFoodQty('${item.id}',-1)">−</button>
              <span class="food-qty-num" id="fq_${item.id}">${qty}</span>
              <button class="food-qty-btn" type="button" onclick="changeFoodQty('${item.id}',1)">+</button>
            </div>
            <button class="food-add-btn ${qty > 0 ? 'added' : ''}" type="button" id="fadd_${item.id}" onclick="addFoodItem('${item.id}')">
              ${qty > 0 ? 'Added' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFoodMenu() {
  const note = byId('foodNote');
  const altMenu = byId('foodMenu');

  if (note) note.textContent = 'Pre-order food with your ticket';

  if (altMenu) {
    altMenu.innerHTML = FOOD_MENU.map(item => {
      const qty = foodCart[item.id] || 0;
      return `
        <div class="food-item">
          <div class="food-emoji">${escapeHtml(item.emoji)}</div>
          <div class="food-info">
            <div class="food-name">${escapeHtml(item.name)}</div>
            <div class="food-price">₹${Number(item.price) || 0}</div>
          </div>
          <div class="food-qty">
            <button onclick="changeFood('${item.id}',-1)" class="qty-btn">−</button>
            <span class="qty-val" id="fqty_${item.id}">${qty}</span>
            <button onclick="changeFood('${item.id}',1)" class="qty-btn">+</button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderFoodCards();
  updateFoodCartSummary();
}

function updateFoodCartSummary() {
  const wrap = byId('foodCartSummary');
  const itemsEl = byId('foodCartItems');
  const totalEl = byId('foodTotalDisplay');

  if (!wrap || !itemsEl || !totalEl) return;

  const entries = Object.entries(foodCart).filter(([, qty]) => qty > 0);

  if (!entries.length) {
    wrap.style.display = 'none';
    itemsEl.innerHTML = '';
    totalEl.textContent = '₹0';
    return;
  }

  wrap.style.display = 'block';

  let total = 0;
  itemsEl.innerHTML = entries.map(([id, qty]) => {
    const item = FOOD_MENU.find(f => f.id === id);
    if (!item) return '';

    const sub = item.price * qty;
    total += sub;

    return `
      <div style="display:flex;justify-content:space-between;gap:10px;padding:4px 0;font-size:.78rem">
        <span style="color:#ddd">${escapeHtml(item.emoji)} ${escapeHtml(item.name)} × ${qty}</span>
        <strong style="color:#fff">₹${sub}</strong>
      </div>
    `;
  }).join('');

  totalEl.textContent = `₹${total}`;
}

window.changeFood = function (id, delta) {
  window.changeFoodQty(id, delta);
  const legacyQty = byId(`fqty_${id}`);
  if (legacyQty) legacyQty.textContent = foodCart[id] || 0;
};

window.changeFoodQty = function (id, delta) {
  foodCart[id] = Math.max(0, (foodCart[id] || 0) + delta);
  if (foodCart[id] === 0) delete foodCart[id];
  window.foodCart = foodCart;

  const qtyEl = byId(`fq_${id}`);
  if (qtyEl) qtyEl.textContent = foodCart[id] || 0;

  const legacyQty = byId(`fqty_${id}`);
  if (legacyQty) legacyQty.textContent = foodCart[id] || 0;

  const addBtn = byId(`fadd_${id}`);
  if (addBtn) {
    addBtn.classList.toggle('added', !!foodCart[id]);
    addBtn.textContent = foodCart[id] ? 'Added' : 'Add';
  }

  updateFoodCartSummary();
  updatePanel();
};

window.addFoodItem = function (id) {
  foodCart[id] = Math.max(1, (foodCart[id] || 0) + 1);
  window.foodCart = foodCart;

  const qtyEl = byId(`fq_${id}`);
  if (qtyEl) qtyEl.textContent = foodCart[id];

  const legacyQty = byId(`fqty_${id}`);
  if (legacyQty) legacyQty.textContent = foodCart[id];

  const addBtn = byId(`fadd_${id}`);
  if (addBtn) {
    addBtn.classList.add('added');
    addBtn.textContent = 'Added';
  }

  updateFoodCartSummary();
  updatePanel();
};

/* ───────────────── booking panel ───────────────── */

let _updatePanelScheduled = false;

function updateSeatLists() {
  const seatTargets = allExisting(['selectedSeatsBox', 'selList']);

  seatTargets.forEach(target => {
    if (!selSeats.length) {
      target.innerHTML =
        target.id === 'selectedSeatsBox'
          ? `<span style="color:var(--muted, #94a3b8);font-size:.76rem">No seats selected yet</span>`
          : `<div class="no-seats" style="color:var(--muted, #94a3b8);font-size:.76rem">No seats selected yet</div>`;
      return;
    }

    target.innerHTML = selSeats.map(seatId => {
      return target.id === 'selectedSeatsBox'
        ? `<span class="seat-tag">${escapeHtml(seatId)}</span>`
        : `<span class="seat-chip">${escapeHtml(seatId)}</span>`;
    }).join('');
  });
}

function updatePanel() {
  if (_updatePanelScheduled) return;

  _updatePanelScheduled = true;
  requestAnimationFrame(() => {
    _updatePanelScheduled = false;
    _doUpdatePanel();
  });
}

function _doUpdatePanel() {
  const baseEls = allExisting(['billSubtotal', 'panelBase']);
  const convEls = allExisting(['billFee', 'panelConv']);
  const foodEls = allExisting(['billFood', 'panelFood']);
  const grandEls = allExisting(['billTotal', 'panelGrand']);
  const loyaltyHint = byId('loyaltyHint');
  const payBtn = byId('payBtn');
  const proceedBtn = byId('proceedBtn');

  updateSeatLists();

  let base = 0;

  const foodTotal = Object.entries(foodCart).reduce((sum, [id, qty]) => {
    const item = FOOD_MENU.find(f => f.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  if (selSeats.length) {
    selSeats.forEach(seatId => {
      const el = document.querySelector(safeSeatSelector(seatId));
      const price = el ? Number(el.dataset.price || 250) : 250;
      base += price;
    });
  }

  const conv = selSeats.length ? Math.round(base * 0.04) : 0;
  const grand = base + conv + foodTotal;

  baseEls.forEach(el => { el.textContent = `₹${base}`; });
  convEls.forEach(el => { el.textContent = `₹${conv}`; });
  foodEls.forEach(el => { el.textContent = `₹${foodTotal}`; });
  grandEls.forEach(el => { el.textContent = `₹${grand}`; });

  const canProceed = selSeats.length > 0;

  [payBtn, proceedBtn].filter(Boolean).forEach(btn => {
    btn.disabled = !canProceed;
    btn.style.opacity = canProceed ? '1' : '.65';
    btn.style.cursor = canProceed ? 'pointer' : 'not-allowed';
  });

  if (loyaltyHint) {
    loyaltyHint.textContent = canProceed
      ? `🏆 You'll earn +${Math.floor(grand / 10)} loyalty points for this booking!`
      : '🏆 Book now and earn loyalty points!';
  }

  updateFoodCartSummary();
}

/* ───────────────── countdown ───────────────── */

function startCountdown() {
  secsLeft = 300;

  const allTimerEls = allExisting(['holdTimer', 'cdTime']);
  if (!allTimerEls.length) return;

  if (cdTimer) clearInterval(cdTimer);

  allTimerEls.forEach(el => el.classList.remove('red'));

  function draw() {
    const m = String(Math.floor(secsLeft / 60)).padStart(2, '0');
    const s = String(secsLeft % 60).padStart(2, '0');
    allTimerEls.forEach(el => { el.textContent = `${m}:${s}`; });
  }

  draw();

  cdTimer = setInterval(async () => {
    secsLeft--;
    draw();

    if (secsLeft <= 60) {
      allTimerEls.forEach(el => el.classList.add('red'));
    }

    if (secsLeft <= 0) {
      clearInterval(cdTimer);
      unlockAllSelectedSeats();
      selSeats = [];
      await renderSeatGrid(curMovieId, curShow.cinema, curShow.time, curShow.date, curShow.format, curPrices);
      toast('⏰ Session expired! Seats released.', 'error');
    }
  }, 1000);
}

/* ───────────────── proceed to payment ───────────────── */

function proceedToPayment() {
  if (!selSeats.length) {
    toast('Select at least one seat', 'error');
    return;
  }

  try {
    if (typeof SESSION !== 'undefined' && SESSION && typeof SESSION.isLoggedIn === 'function') {
      if (!SESSION.isLoggedIn()) {
        location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
        return;
      }
    }
  } catch (err) {
    console.warn('SESSION check failed:', err);
  }

  let base = 0;
  selSeats.forEach(sid => {
    const el = document.querySelector(safeSeatSelector(sid));
    base += el ? Number(el.dataset.price || 250) : 250;
  });

  const foodTotal = Object.entries(foodCart).reduce((sum, [id, qty]) => {
    const item = FOOD_MENU.find(f => f.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const conv = Math.round(base * 0.04);

  const draft = {
    id: 'DR' + Date.now(),
    movieId: curMovieId,
    movieTitle: byId('sumMovieTitle')?.textContent || byId('bkName')?.textContent || byId('movieTitle')?.textContent || 'Movie',
    seats: [...selSeats],
    show: { ...curShow },
    basePrice: base,
    convenienceFee: conv,
    foodItems: { ...foodCart },
    foodTotal,
    totalAmount: base + conv + foodTotal,
    createdAt: new Date().toISOString()
  };

  sessionStorage.setItem('mz_draft', JSON.stringify(draft));

  if (cdTimer) clearInterval(cdTimer);
  location.href = 'payment.html';
}

/* ───────────────── seat count popup ───────────────── */

function showSeatCountPopup(movieId, cinema, time, date, format) {
  byId('seatCountPopup')?.remove();

  const pop = document.createElement('div');
  pop.id = 'seatCountPopup';
  pop.style.cssText =
    'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center';

  pop.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--b1);border-radius:var(--rlg);padding:32px;max-width:400px;width:90%;text-align:center;animation:popIn .28s ease">
      <div style="font-size:2.8rem;margin-bottom:10px">🎟️</div>
      <h3 style="font-family:var(--fu);font-size:1.3rem;font-weight:700;margin-bottom:6px">How many tickets?</h3>
      <p style="font-size:.82rem;color:var(--mt);margin-bottom:20px">Select number of seats to continue</p>
      <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:22px">
        ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `
          <div onclick="goBooking(${n},'${String(movieId).replace(/'/g, "\\'")}','${encodeURIComponent(cinema)}','${encodeURIComponent(time)}','${encodeURIComponent(date)}','${encodeURIComponent(format)}')"
            style="width:44px;height:44px;border-radius:50%;border:2px solid var(--b2);display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:700;font-size:1rem;transition:all .2s"
            onmouseover="this.style.background='var(--red)';this.style.borderColor='var(--red)';this.style.color='#fff'"
            onmouseout="this.style.background='';this.style.borderColor='var(--b2)';this.style.color=''">${n}</div>
        `).join('')}
      </div>
      <button onclick="document.getElementById('seatCountPopup').remove()" style="background:transparent;border:1px solid var(--b2);color:var(--mt);padding:8px 20px;border-radius:var(--rsm);cursor:pointer;font-size:.84rem">Cancel</button>
    </div>
  `;

  document.body.appendChild(pop);
}

window.goBooking = function (count, movieId, cinema, time, date, format) {
  byId('seatCountPopup')?.remove();

  location.href =
    `booking.html?id=${encodeURIComponent(movieId)}` +
    `&cinema=${encodeURIComponent(cinema)}` +
    `&time=${encodeURIComponent(time)}` +
    `&date=${encodeURIComponent(date)}` +
    `&format=${encodeURIComponent(format)}` +
    `&count=${encodeURIComponent(count)}`;
};

window.showSeatCountPopup = showSeatCountPopup;

/* ───────────────── auto-select ───────────────── */

function autoSelectRequestedCount() {
  const p = new URLSearchParams(location.search);
  const count = parseInt(p.get('count') || '0', 10);

  if (!count || count < 1) return;

  const allSeats = [...document.querySelectorAll('.seat[data-sid]')];
  const sk = sKey(curShow.cinema, curShow.time, curShow.date);
  let picked = 0;

  for (const seat of allSeats) {
    if (picked >= count) break;

    if (
      !seat.classList.contains('booked') &&
      !seat.classList.contains('filling') &&
      !seat.classList.contains('selected')
    ) {
      const sid = seat.dataset.sid;
      if (!sid || selSeats.includes(sid)) continue;

      selSeats.push(sid);
      seat.classList.add('selected');
      seat.classList.remove('bestseller');
      lockSeat(curMovieId, sk, sid);
      picked++;
    }
  }

  if (picked > 0) updatePanel();
}

/* ───────────────── split bill ───────────────── */

window.openSplitBill = window.openSplitBill || function () {
  const selectedCount = selSeats.length;
  const totalText = (byId('billTotal') || {}).textContent || '₹0';
  const total = Number(String(totalText).replace(/[^\d]/g, '')) || 0;

  if (!selectedCount) {
    toast('Select seats first to split bill', 'warn');
    return;
  }

  const perPerson = Math.ceil(total / selectedCount);
  toast(`Each person pays: ₹${perPerson} — Link copied! (Beta)`, 'info');
};

/* ───────────────── movie loading ───────────────── */

function getFallbackMovie(movieId) {
  return {
    _id: movieId,
    title: 'Demo Movie',
    poster: '🎬',
    bg: 'linear-gradient(135deg,#111827,#1f2937,#0f172a)',
    price: {
      recliner: 500,
      premium: 350,
      regular: 250,
      economy: 180
    }
  };
}

async function loadMovieById(movieId) {
  if (!window.API || typeof API.get !== 'function') {
    console.warn('API.get unavailable, using fallback movie');
    return getFallbackMovie(movieId);
  }

  try {
    const d = await API.get(`/movies/${movieId}`);
    const m = getMoviePayload(d);
    if (m) return m;
    console.warn('Movie payload missing, using fallback movie');
    return getFallbackMovie(movieId);
  } catch (err) {
    console.warn('Movie fetch failed, using fallback movie:', err?.message || err);
    return getFallbackMovie(movieId);
  }
}

function setMovieUI(m, cinema, time, date, format) {
  document.title = `Select Seats — ${m.title || 'Movie'} | BookMyShow`;

  const metaStr = `${cinema} · ${time} · ${date} · ${format}`;

  allExisting(['bkName', 'movieTitle', 'sumMovieTitle']).forEach(el => {
    el.textContent = m.title || 'Movie';
  });

  allExisting(['bkMeta', 'cinemaInfo', 'sumMovieMeta', 'bkHeaderMeta', 'bookingMeta']).forEach(el => {
    el.textContent = metaStr;
  });

  const posterEl = byId('bkPoster');
  if (posterEl) {
    if (
      m.poster &&
      typeof m.poster === 'string' &&
      (m.poster.startsWith('http://') || m.poster.startsWith('https://'))
    ) {
      posterEl.innerHTML = `<img src="${escapeHtml(m.poster)}" alt="${escapeHtml(m.title || 'Movie')}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
    } else {
      posterEl.style.background = m.bg || 'linear-gradient(135deg,#111827,#1f2937,#0f172a)';
      posterEl.textContent = m.poster || '🎬';
    }
  }
}

/* ───────────────── page init ───────────────── */

async function initBookingPage() {
  const p = new URLSearchParams(location.search);

  const movieId = p.get('id');
  const cinema = safeDecode(p.get('cinema'), 'PVR IMAX Juhu');
  const time = safeDecode(p.get('time'), '7:30 PM');
  const date = safeDecode(p.get('date'), 'Today');
  const format = safeDecode(p.get('format'), '2D');

  if (!movieId || movieId === 'REAL_ID_HERE' || movieId === 'YOUR_MOVIE_ID') {
    renderFatalState('Invalid movie ID. Open booking from the movie page/showtime.');
    return;
  }

  try {
    const m = await loadMovieById(movieId);

    setMovieUI(m, cinema, time, date, format);
    renderFoodMenu();
    await renderSeatGrid(movieId, cinema, time, date, format, m.price || {});
    autoSelectRequestedCount();
    updatePanel();
    startCountdown();

    const payBtn = byId('payBtn');
    const proceedBtn = byId('proceedBtn');

    if (payBtn) payBtn.onclick = proceedToPayment;
    if (proceedBtn) proceedBtn.onclick = proceedToPayment;

    const splitBtn = byId('splitBtn');
    if (splitBtn) {
      splitBtn.onclick = () => {
        if (!selSeats.length) {
          toast('Pehle seats select karo', 'warn');
          return;
        }
        window.openSplitBill();
      };
    }

    safeHideLoader(true);
  } catch (err) {
    console.error('initBookingPage error:', err);
    renderFatalState(err.message || 'Failed to load booking page');
    toast(err.message || 'Failed to load booking page', 'error');
  }
}

/* ───────────────── boot ───────────────── */

function bootBookingPage() {
  if (bookingBooted) return;
  bookingBooted = true;

  safeMountNavbar();

  initBookingPage().catch(err => {
    console.error('Boot error:', err);
    renderFatalState(err.message || 'Booking page crashed');
  });

  setTimeout(() => safeHideLoader(true), 1200);
}

document.addEventListener('DOMContentLoaded', bootBookingPage);

window.addEventListener('beforeunload', () => {
  try {
    if (cdTimer) clearInterval(cdTimer);
    unlockAllSelectedSeats();
  } catch (err) {
    console.warn('beforeunload cleanup failed:', err);
  }
});