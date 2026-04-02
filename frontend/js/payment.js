// js/payment.js — merged + fixed full version

let paymentDraft = null;
let appliedDiscount = 0;
let appliedCoupon = '';

function byId(id) {
  return document.getElementById(id);
}

function _setText(id, val) {
  const el = byId(id);
  if (el) el.textContent = val;
}

function toast(msg, type = 'info', ms = 2600) {
  if (typeof TOAST !== 'undefined' && TOAST && typeof TOAST.show === 'function') {
    TOAST.show(msg, type, ms);
  } else {
    console.log(`[${type}] ${msg}`);
  }
}

function safeToast(msg, type = 'info', ms = 2600) {
  toast(msg, type, ms);
}

function safeMountNavbar() {
  if (typeof mountNavbar === 'function') {
    try {
      mountNavbar('profile');
    } catch (e) {
      try {
        mountNavbar('movie');
      } catch (_) {}
    }
  }
}

function safeHideLoader() {
  const loader = byId('pageLoader');
  if (!loader) return;

  if (typeof hideLoader === 'function') {
    hideLoader();
    return;
  }

  setTimeout(() => {
    loader.classList.add('gone');
  }, 350);
}

function formatMoney(v) {
  const n = Number(v) || 0;
  return `₹${n}`;
}

function ticketId() {
  return 'TKT' + Date.now().toString().slice(-8);
}

function getDraft() {
  try {
    return JSON.parse(sessionStorage.getItem('mz_draft') || 'null');
  } catch {
    return null;
  }
}

function loadDraft() {
  return getDraft();
}

function getLoggedUser() {
  try {
    if (typeof SESSION !== 'undefined' && SESSION && typeof SESSION.getUser === 'function') {
      return SESSION.getUser();
    }
    return null;
  } catch {
    return null;
  }
}

function saveBooking(booking) {
  try {
    const all = JSON.parse(localStorage.getItem('mz_bookings') || '[]');
    all.unshift(booking);
    localStorage.setItem('mz_bookings', JSON.stringify(all));
    localStorage.setItem('mz_last_ticket', JSON.stringify(booking));
    localStorage.setItem('mz_last_booking', JSON.stringify(booking));
  } catch (err) {
    console.error('saveBooking error:', err);
  }
}

function saveLocalBooking(booking) {
  saveBooking(booking);
}

function getMovieMeta(movie) {
  return {
    title: movie?.title || paymentDraft?.movieTitle || 'Movie',
    poster: movie?.poster || movie?.emoji || paymentDraft?.moviePoster || '🎬',
    bg: movie?.bg || paymentDraft?.movieBg || 'linear-gradient(135deg,#111827,#1f2937,#0f172a)',
    genre: Array.isArray(movie?.genre)
      ? movie.genre
      : (movie?.category ? [movie.category] : (paymentDraft?.genres || []))
  };
}

function renderSummary(draft) {
  _setText('sumMovie', draft.movieTitle || 'Movie');
  _setText(
    'sumMeta',
    `${draft.show?.cinema || 'Cinema'} · ${draft.show?.time || ''} · ${draft.show?.date || ''} · ${draft.show?.format || ''}`
  );

  const seatsEl = byId('sumSeats');
  if (seatsEl) {
    seatsEl.innerHTML = (draft.seats || []).length
      ? draft.seats.map(s => `<span class="ticket-chip">${s}</span>`).join('')
      : `<span style="color:#94a3b8;font-size:.78rem">No seats selected</span>`;
  }

  _setText('sumBase', formatMoney(draft.basePrice || 0));
  _setText('sumFood', formatMoney(draft.foodTotal || 0));
  _setText('sumConv', formatMoney(draft.convenienceFee || 0));
  _setText('sumTotal', formatMoney(Math.max(0, (draft.totalAmount || 0) - appliedDiscount)));
}

function renderSimpleSummary(draft, movie) {
  const meta = getMovieMeta(movie);

  _setText('sumMovie', meta.title);
  _setText('sumMeta', `${draft.show?.cinema || 'Cinema'} · ${draft.show?.time || ''} · ${draft.show?.date || ''} · ${draft.show?.format || ''}`);
  _setText('sumBase', `₹${draft.basePrice || 0}`);
  _setText('sumFood', `₹${draft.foodTotal || 0}`);
  _setText('sumConv', `₹${draft.convenienceFee || 0}`);
  _setText('sumTotal', `₹${Math.max(0, (draft.totalAmount || 0) - appliedDiscount)}`);

  const seatWrap = byId('sumSeats');
  if (seatWrap) {
    seatWrap.innerHTML = (draft.seats || [])
      .map(seat => `<span class="ticket-chip">${seat}</span>`)
      .join('');
  }

  const pts = Math.floor((draft.totalAmount || 0) / 10);
  _setText('loyaltyPreview', `🏆 You'll earn +${pts} loyalty points for this booking!`);
}

function renderDetailedSummary(draft, movie) {
  const meta = getMovieMeta(movie);

  const poster = byId('payPoster');
  if (poster) {
    poster.style.background = meta.bg;
    poster.textContent = meta.poster;
  }

  _setText('payMovieName', meta.title);
  _setText('payCinema', draft.show?.cinema || '');
  _setText('payTime', `${draft.show?.date || ''} · ${draft.show?.time || ''}`);
  _setText('payFormat', draft.show?.format || '');
  _setText('paySeats', (draft.seats || []).join(', '));
  _setText('paySeatsCount', `${(draft.seats || []).length} seat${(draft.seats || []).length > 1 ? 's' : ''}`);
  _setText('payBase', `₹${draft.basePrice || 0}`);
  _setText('payConv', `₹${draft.convenienceFee || 0}`);
  _setText('payFood', draft.foodTotal ? `₹${draft.foodTotal}` : '₹0');
  _setText('payTotal', `₹${Math.max(0, (draft.totalAmount || 0) - appliedDiscount)}`);

  const pts = Math.floor((draft.totalAmount || 0) / 10);
  _setText('loyaltyPreview', `🏆 You'll earn +${pts} loyalty points for this booking!`);
}

function renderAll(draft, movie) {
  renderSummary(draft);
  renderSimpleSummary(draft, movie);
  renderDetailedSummary(draft, movie);
  fillUserDetails();
}

function fillUserDetails() {
  try {
    const user = getLoggedUser();
    if (!user) return;

    if (byId('cardName') && user.name && !byId('cardName').value.trim()) {
      byId('cardName').value = user.name;
    }
    if (byId('payEmail') && user.email && !byId('payEmail').value.trim()) {
      byId('payEmail').value = user.email;
    }
  } catch (err) {
    console.error(err);
  }
}

function updatePaymentPlaceholders() {
  const method = byId('payMethod')?.value || document.querySelector('.pay-tab.on')?.dataset.tab || 'card';
  const number = byId('cardNumber');
  const expiry = byId('cardExpiry');
  const cvv = byId('cardCvv');

  if (!number || !expiry || !cvv) return;

  if (method === 'upi') {
    number.placeholder = 'rahul@upi';
    expiry.disabled = true;
    cvv.disabled = true;
    expiry.value = '';
    cvv.value = '';
  } else if (method === 'wallet') {
    number.placeholder = 'Wallet Mobile Number';
    expiry.disabled = true;
    cvv.disabled = true;
    expiry.value = '';
    cvv.value = '';
  } else {
    number.placeholder = '1234 5678 9012 3456';
    expiry.disabled = false;
    cvv.disabled = false;
  }
}

function bindPaymentTabs() {
  document.querySelectorAll('.pay-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('on'));
      document.querySelectorAll('.pay-panel').forEach(p => p.classList.remove('show'));
      tab.classList.add('on');
      byId(`pp_${tab.dataset.tab}`)?.classList.add('show');
      updatePaymentPlaceholders();
    });
  });

  document.querySelectorAll('.upi-app').forEach(a => {
    a.addEventListener('click', () => {
      a.closest('.upi-apps')?.querySelectorAll('.upi-app').forEach(x => x.classList.remove('on'));
      a.classList.add('on');
    });
  });
}

function validatePaymentForm() {
  const method = document.querySelector('.pay-tab.on')?.dataset.tab || byId('payMethod')?.value || 'card';
  const cardName = byId('cardName')?.value.trim() || '';
  const cardNumber = byId('cardNumber')?.value.trim() || '';
  const payEmail = byId('payEmail')?.value.trim() || '';
  const cardExpiry = byId('cardExpiry')?.value.trim() || '';
  const cardCvv = byId('cardCvv')?.value.trim() || '';

  if (!cardName) {
    toast('Enter card holder name', 'warn');
    return false;
  }

  if (!payEmail || !payEmail.includes('@')) {
    toast('Enter a valid email', 'warn');
    return false;
  }

  if (method === 'upi') {
    if (byId('cardNumber') && (!cardNumber || !cardNumber.includes('@'))) {
      toast('Enter valid UPI ID', 'warn');
      return false;
    }
    return true;
  }

  if (method === 'wallet') {
    if (byId('cardNumber') && (!cardNumber || cardNumber.length < 10)) {
      toast('Enter valid wallet mobile number', 'warn');
      return false;
    }
    return true;
  }

  if (byId('cardNumber') && (!cardNumber || cardNumber.replace(/\s/g, '').length < 12)) {
    toast('Enter valid card number', 'warn');
    return false;
  }

  if (byId('cardExpiry') && (!cardExpiry || !/^\d{2}(\/|\s\/\s)\d{2}$|^\d{2}\/\d{2}$/.test(cardExpiry))) {
    toast('Enter expiry in MM/YY format', 'warn');
    return false;
  }

  if (byId('cardCvv') && (!cardCvv || cardCvv.length < 3)) {
    toast('Enter valid CVV', 'warn');
    return false;
  }

  return true;
}

async function applyCoupon() {
  const code = byId('couponInp')?.value.trim();
  const msgEl = byId('couponMsg');
  if (!code) return;

  try {
    const draft = getDraft();
    if (!draft) {
      safeToast('Booking draft missing', 'error');
      return;
    }

    if (typeof API !== 'undefined' && API && typeof API.post === 'function') {
      const d = await API.post('/bookings/coupon', { code, amount: draft.basePrice });

      if (d && d.success) {
        appliedDiscount = d.discount || 0;
        appliedCoupon = d.code || code;

        if (msgEl) {
          msgEl.style.color = 'var(--green)';
          msgEl.textContent = `✅ ${d.label || 'Coupon applied'} — Saved ₹${appliedDiscount}`;
        }

        const newTotal = (draft.totalAmount || 0) - appliedDiscount;
        _setText('payTotal', `₹${Math.max(0, newTotal)}`);
        _setText('sumTotal', `₹${Math.max(0, newTotal)}`);

        safeToast(`Coupon applied! Saved ₹${appliedDiscount}`, 'success');
      } else {
        if (msgEl) {
          msgEl.style.color = 'var(--red)';
          msgEl.textContent = `❌ ${(d && d.message) || 'Invalid coupon'}`;
        }
        appliedDiscount = 0;
        appliedCoupon = '';
      }
      return;
    }
  } catch {}

  const upper = code.toUpperCase();
  const draft = getDraft();

  let discount = 0;
  let label = '';

  if (upper === 'BMS100') {
    discount = 100;
    label = 'Flat ₹100 Off';
  } else if (upper === 'SAVE50') {
    discount = 50;
    label = 'Flat ₹50 Off';
  } else if (upper === 'FIRST') {
    discount = Math.min(150, Math.round((draft?.basePrice || 0) * 0.1));
    label = 'First Booking Offer';
  }

  if (discount > 0) {
    appliedDiscount = discount;
    appliedCoupon = upper;

    if (msgEl) {
      msgEl.style.color = 'var(--green)';
      msgEl.textContent = `✅ ${label} — Saved ₹${discount}`;
    }

    const newTotal = (draft?.totalAmount || 0) - discount;
    _setText('payTotal', `₹${Math.max(0, newTotal)}`);
    _setText('sumTotal', `₹${Math.max(0, newTotal)}`);

    safeToast(`Coupon applied! Saved ₹${discount}`, 'success');
  } else {
    if (msgEl) {
      msgEl.style.color = 'var(--red)';
      msgEl.textContent = `❌ Invalid coupon`;
    }
    appliedDiscount = 0;
    appliedCoupon = '';
    safeToast('Coupon validation failed', 'error');
  }
}

function buildTicketPreview(booking) {
  const movieEl = byId('ticketMovie');
  const metaEl = byId('ticketMeta');
  const seatsEl = byId('ticketSeats');
  const idEl = byId('ticketId');
  const wrap = byId('ticketPreview');

  if (movieEl) movieEl.textContent = booking.movieTitle || 'Movie';
  if (metaEl) {
    metaEl.textContent =
      `${booking.show?.cinema || 'Cinema'} · ${booking.show?.time || ''} · ${booking.show?.date || ''} · ${booking.show?.format || ''}`;
  }

  if (seatsEl) {
    seatsEl.innerHTML = (booking.seats || [])
      .map(s => `<span class="ticket-chip">${s}</span>`)
      .join('');
  }

  if (idEl) idEl.textContent = booking.ticketId || booking.id || booking._id || '';
  if (wrap) wrap.style.display = 'block';
}

function markBookedSeats(draft) {
  try {
    const sk = `${draft.show.cinema}|||${draft.show.time}|||${draft.show.date}`.replace(/\s/g, '_');
    const key = `bk_${draft.movieId}_${sk}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([...new Set([...existing, ...(draft.seats || [])])]));
  } catch (err) {
    console.error('markBookedSeats error:', err);
  }
}

function lockSeatsAsBooked(booking) {
  try {
    const sk = `${booking.show.cinema}|||${booking.show.time}|||${booking.show.date}`.replace(/\s/g, '_');
    const key = `bk_${booking.movieId}_${sk}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const merged = [...new Set([...(existing || []), ...(booking.seats || [])])];
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (err) {
    console.error('lockSeatsAsBooked error:', err);
  }
}

function buildLocalBookingFromDraft(draft, movie) {
  const meta = getMovieMeta(movie);
  const user = getLoggedUser();

  return {
    _id: 'BK' + Date.now(),
    id: 'TKT' + Date.now(),
    bookingId: 'BK' + Date.now(),
    ticketId: ticketId(),
    movieId: draft.movieId,
    movieTitle: meta.title,
    moviePoster: meta.poster,
    movieBg: meta.bg,
    genres: meta.genre || [],
    show: { ...draft.show },
    cinema: draft.show?.cinema,
    date: draft.show?.date,
    time: draft.show?.time,
    format: draft.show?.format,
    language: draft.language || 'Hindi',
    seats: draft.seats || [],
    seatCategory: draft.seatCategory || 'Regular',
    basePrice: draft.basePrice || 0,
    subtotal: draft.basePrice || 0,
    convenienceFee: draft.convenienceFee || 0,
    foodItems: draft.foodItems || {},
    foodTotal: draft.foodTotal || 0,
    couponApplied: appliedCoupon || '',
    discount: appliedDiscount || 0,
    totalAmount: Math.max(0, (draft.totalAmount || 0) - (appliedDiscount || 0)),
    total: Math.max(0, (draft.totalAmount || 0) - (appliedDiscount || 0)),
    paymentMethod: document.querySelector('.pay-tab.on')?.dataset.tab || byId('payMethod')?.value || 'upi',
    userName: user?.name || 'Guest',
    userEmail: user?.email || '',
    paidAt: new Date().toISOString(),
    bookedAt: new Date().toISOString(),
    status: 'confirmed'
  };
}

async function processPayment(draft, movie) {
  const overlay = byId('procOverlay');
  if (overlay) overlay.classList.add('show');

  const btn = byId('confirmPayBtn') || byId('payBtn');
  const note = byId('successNote');

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Processing...';
  }

  await new Promise(r => setTimeout(r, 1200));

  try {
    const payMethod =
      document.querySelector('.pay-tab.on')?.dataset.tab ||
      byId('payMethod')?.value ||
      'upi';

    const bookingData = {
      movieId: draft.movieId,
      cinema: draft.show?.cinema,
      date: draft.show?.date,
      time: draft.show?.time,
      format: draft.show?.format,
      language: draft.language || 'Hindi',
      seats: draft.seats || [],
      seatCategory: draft.seatCategory || 'Regular',
      basePrice: draft.basePrice || 0,
      convenienceFee: draft.convenienceFee || 0,
      totalAmount: Math.max(0, (draft.totalAmount || 0) - (appliedDiscount || 0)),
      paymentMethod: payMethod,
      couponApplied: appliedCoupon,
      discount: appliedDiscount,
      foodItems: draft.foodItems || {},
      foodTotal: draft.foodTotal || 0
    };

    let finalBooking = null;

    try {
      if (typeof API !== 'undefined' && API && typeof API.post === 'function') {
        const d = await API.post('/bookings', bookingData);

        if (d && d.success && d.booking) {
          const meta = getMovieMeta(movie);
          finalBooking = {
            ...d.booking,
            movieTitle: meta.title,
            moviePoster: meta.poster,
            movieBg: meta.bg,
            genres: meta.genre || [],
            total: d.booking.total || bookingData.totalAmount,
            totalAmount: d.booking.totalAmount || bookingData.totalAmount,
            status: d.booking.status || 'confirmed'
          };
        }
      }
    } catch (apiErr) {
      console.warn('Booking API failed, using local fallback:', apiErr);
    }

    if (!finalBooking) {
      finalBooking = buildLocalBookingFromDraft(draft, movie);
    }

    saveLocalBooking(finalBooking);
    saveBooking(finalBooking);
    markBookedSeats(draft);
    lockSeatsAsBooked(finalBooking);
    buildTicketPreview(finalBooking);

    sessionStorage.removeItem('mz_draft');
    sessionStorage.setItem('mz_lastBk', finalBooking._id || finalBooking.id || '');

    if (overlay) overlay.classList.remove('show');
    if (note) note.style.display = 'block';

    safeToast('Payment successful! Ticket generated ✅', 'success');

    if (btn) {
      btn.textContent = 'Payment Successful';
      btn.disabled = true;
    }

    setTimeout(() => {
      if (finalBooking._id) {
        location.href = `ticket.html?id=${encodeURIComponent(finalBooking._id)}`;
      } else if (finalBooking.id) {
        location.href = `ticket.html?id=${encodeURIComponent(finalBooking.id)}`;
      } else {
        location.href = 'profile.html#bookings';
      }
    }, 900);

  } catch (err) {
    if (overlay) overlay.classList.remove('show');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Confirm Payment';
    }
    safeToast('Payment failed: ' + err.message, 'error');
  }
}

function finishPayment() {
  if (!paymentDraft) return;
  if (!validatePaymentForm()) return;
  processPayment(paymentDraft, { title: paymentDraft.movieTitle || 'Movie' });
}

window.fmtCard = inp => {
  let v = inp.value.replace(/\s+/g, '').replace(/\D/g, '');
  inp.value = (v.match(/.{1,4}/g) || []).join('  ');
};

window.fmtExp = inp => {
  let v = inp.value.replace(/\D/g, '');
  if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2, 4);
  inp.value = v;
};

window.selUPI = el => {
  el.closest('.upi-apps')?.querySelectorAll('.upi-app').forEach(a => a.classList.remove('on'));
  el.classList.add('on');
};

async function initPaymentPage() {
  paymentDraft = getDraft();

  if (!paymentDraft) {
    safeToast('No booking draft found. Please select seats first.', 'warn');
    setTimeout(() => {
      location.href = 'index.html';
    }, 800);
    safeHideLoader();
    return;
  }

  if (typeof SESSION !== 'undefined' && SESSION && typeof SESSION.isLoggedIn === 'function') {
    if (!SESSION.isLoggedIn()) {
      location.href = 'login.html?redirect=payment.html';
      return;
    }
  }

  try {
    let movie = null;

    try {
      if (typeof API !== 'undefined' && API && typeof API.get === 'function') {
        const d = await API.get(`/movies/${paymentDraft.movieId}`);
        if (d && d.success) {
          movie = d.movie;
        }
      }
    } catch (err) {
      console.warn('Movie fetch failed, using draft only:', err);
    }

    const movieTitle = movie?.title || paymentDraft.movieTitle || 'Movie';
    document.title = `Payment — ${movieTitle} | BookMyShow`;

    renderAll(paymentDraft, movie || { title: paymentDraft.movieTitle || 'Movie' });
    bindPaymentTabs();
    fillUserDetails();
    updatePaymentPlaceholders();

    byId('applyBtn')?.addEventListener('click', applyCoupon);
    byId('couponInp')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') applyCoupon();
    });

    const method = byId('payMethod');
    if (method) {
      method.addEventListener('change', updatePaymentPlaceholders);
    }

    byId('payBtn')?.addEventListener('click', () => {
      if (!validatePaymentForm()) return;
      processPayment(paymentDraft, movie || { title: paymentDraft.movieTitle || 'Movie' });
    });

    byId('confirmPayBtn')?.addEventListener('click', () => {
      if (!validatePaymentForm()) return;
      processPayment(paymentDraft, movie || { title: paymentDraft.movieTitle || 'Movie' });
    });

    safeHideLoader();
  } catch (err) {
    safeToast('Error: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  safeMountNavbar();

  if (typeof initNavSearch === 'function') {
    setTimeout(() => initNavSearch(), 50);
  }

  initPaymentPage();
});