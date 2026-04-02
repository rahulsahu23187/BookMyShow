// js/ticket.js

function byId(id) {
  return document.getElementById(id);
}

function safeToast(msg, type = "info", ms = 2500) {
  if (typeof TOAST !== "undefined" && TOAST && typeof TOAST.show === "function") {
    TOAST.show(msg, type, ms);
  } else {
    console.log(`[${type}] ${msg}`);
  }
}

function safeMountNavbar() {
  if (typeof mountNavbar === "function") {
    mountNavbar("");
  }
}

function safeInitNavSearch() {
  if (typeof initNavSearch === "function") {
    setTimeout(() => initNavSearch(), 50);
  }
}

function safeHideLoader() {
  const loader = byId("pageLoader");
  if (!loader) return;

  if (typeof hideLoader === "function") {
    hideLoader();
  } else {
    setTimeout(() => loader.classList.add("gone"), 400);
  }
}

function getLastBookingId() {
  return (
    new URLSearchParams(location.search).get("id") ||
    sessionStorage.getItem("mz_lastBk") ||
    (() => {
      try {
        const last = JSON.parse(localStorage.getItem("mz_last_ticket") || "null");
        return last?._id || last?.id || last?.bookingId || "";
      } catch {
        return "";
      }
    })()
  );
}

function getLoggedUser() {
  try {
    if (typeof SESSION !== "undefined" && SESSION && typeof SESSION.getUser === "function") {
      return SESSION.getUser();
    }
    return null;
  } catch {
    return null;
  }
}

function findMovieBooking(id) {
  try {
    const local = JSON.parse(localStorage.getItem("mz_bookings") || "[]");
    return local.find(b => b._id === id || b.bookingId === id || b.id === id) || null;
  } catch {
    return null;
  }
}

function findEventBooking(id) {
  try {
    const local = JSON.parse(localStorage.getItem("mz_event_bookings") || "[]");
    return local.find(b => b._id === id || b.bookingId === id || b.id === id) || null;
  } catch {
    return null;
  }
}

function getMovieMeta(movie, bk) {
  return {
    title: movie?.title || bk?.movieTitle || bk?.title || "Unknown Show",
    poster: movie?.poster || bk?.moviePoster || (bk?.isEvent ? "🎤" : "🎬"),
    bg: movie?.bg || bk?.movieBg || (bk?.isEvent ? "#24124a" : "#1a1a2e"),
    genre: Array.isArray(movie?.genre)
      ? movie.genre
      : (Array.isArray(bk?.genres) ? bk.genres : [])
  };
}

function normalizeBooking(bk, movie = null) {
  if (!bk) return null;

  const meta = getMovieMeta(movie, bk);

  return {
    bookingId: bk.bookingId || bk._id || bk.id || "MZ0000",
    movieId: bk.movieId || bk.movie?._id || "",
    title: meta.title,
    poster: meta.poster,
    bg: meta.bg,
    genre: meta.genre,
    cinema: bk.cinema || bk.venue || bk.show?.cinema || "—",
    date: bk.date || bk.show?.date || "—",
    time: bk.time || bk.show?.time || "—",
    format: bk.format || bk.show?.format || (bk.isEvent ? "Live" : "2D"),
    language:
      bk.language ||
      movie?.language ||
      (Array.isArray(movie?.lang) ? movie.lang.join(", ") : "") ||
      (bk.isEvent ? "Live Event" : "Hindi"),
    seats: Array.isArray(bk.seats) ? bk.seats : [],
    seatCategory: bk.seatCategory || "Regular",
    total: bk.totalAmount || bk.total || 0,
    userName: bk.userName || "",
    bookedAt: bk.bookedAt || "",
    loyaltyPointsEarned: bk.loyaltyPointsEarned || Math.floor((bk.totalAmount || bk.total || 0) / 10),
    foodItems: bk.foodItems || {},
    isEvent: !!bk.isEvent,
    raw: bk
  };
}

async function tryFetchBookingFromAPI(id) {
  try {
    if (typeof API !== "undefined" && API && typeof API.get === "function") {
      const d = await API.get(`/bookings/${id}`);
      if (d && d.success && d.booking) {
        return d.booking;
      }
    }
  } catch (err) {
    console.warn("Booking API fallback to local:", err);
  }
  return null;
}

async function tryFetchMovie(movieId) {
  if (!movieId) return null;

  try {
    if (typeof API !== "undefined" && API && typeof API.get === "function") {
      const md = await API.get(`/movies/${movieId}`);
      if (md && md.success && md.movie) {
        return md.movie;
      }
    }
  } catch (err) {
    console.warn("Movie meta fetch failed:", err);
  }

  return null;
}

async function initTicketPage() {
  const id = getLastBookingId();

  if (!id) {
    location.href = "index.html";
    return;
  }

  const apiBooking = await tryFetchBookingFromAPI(id);
  if (apiBooking) {
    const movie = await tryFetchMovie(apiBooking.movieId || apiBooking.movie?._id || "");
    renderTicket(normalizeBooking(apiBooking, movie));
    return;
  }

  const movieBooking = findMovieBooking(id);
  if (movieBooking) {
    const movie = await tryFetchMovie(movieBooking.movieId || "");
    renderTicket(normalizeBooking(movieBooking, movie));
    return;
  }

  const eventBooking = findEventBooking(id);
  if (eventBooking) {
    renderTicket(normalizeBooking(eventBooking, null));
    return;
  }

  location.href = "index.html";
}

function renderTicket(bk) {
  if (!bk) {
    location.href = "index.html";
    return;
  }

  const user = getLoggedUser();

  document.title = `Ticket — ${bk.title} | BookMyShow`;

  const posterEl = byId("ticketPosterEl");
  const posterNode = byId("tPoster");

  if (posterEl) posterEl.style.background = bk.bg;

  if (posterNode) {
    if (typeof bk.poster === "string" && /^https?:\/\//i.test(bk.poster)) {
      posterNode.innerHTML = `<img src="${bk.poster}" alt="${bk.title}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.outerHTML='🎬'">`;
    } else if (typeof bk.poster === "string" && bk.poster.startsWith("/")) {
      posterNode.innerHTML = `<img src="${bk.poster}" alt="${bk.title}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.outerHTML='🎬'">`;
    } else {
      posterNode.textContent = bk.poster || (bk.isEvent ? "🎤" : "🎬");
    }
  }

  const fields = {
    tMovie: bk.title,
    tCinema: bk.cinema,
    tDate: bk.date,
    tTime: bk.time,
    tFormat: bk.format,
    tLang: bk.language,
    tSeatCat: bk.seatCategory,
    tSeats: bk.seats.length ? bk.seats.join(", ") : "—",
    tAmount: `₹${bk.total}`,
    tId: bk.bookingId,
    tUser: bk.userName || user?.name || "Guest",
    tPoints: `+${bk.loyaltyPointsEarned} pts`,
    tBooked: bk.bookedAt
      ? new Date(bk.bookedAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "—"
  };

  Object.entries(fields).forEach(([k, v]) => {
    const el = byId(k);
    if (el) el.textContent = v;
  });

  const foodEl = byId("tFood");
  if (foodEl) {
    const FOOD_MENU = [
      { id: "popcorn", name: "Popcorn", emoji: "🍿" },
      { id: "coke", name: "Coke", emoji: "🥤" },
      { id: "nachos", name: "Nachos", emoji: "🧂" },
      { id: "combo1", name: "Combo 1", emoji: "🎬" },
      { id: "combo", name: "Combo", emoji: "🎬" },
      { id: "icecream", name: "Ice Cream", emoji: "🍦" },
      { id: "pc", name: "Popcorn Combo", emoji: "🍿" },
      { id: "nc", name: "Nachos + Coke", emoji: "🧂" },
      { id: "bc", name: "Burger Combo", emoji: "🍔" },
      { id: "cf", name: "Coffee", emoji: "☕" },
      { id: "ic", name: "Ice Cream", emoji: "🍦" }
    ];

    const items = Object.entries(bk.foodItems || {})
      .filter(([, q]) => Number(q) > 0)
      .map(([id, qty]) => {
        const f = FOOD_MENU.find(x => x.id === id);
        return f ? `${f.emoji} ${f.name} x${qty}` : `${id} x${qty}`;
      })
      .filter(Boolean);

    foodEl.textContent = items.length ? items.join(", ") : "None";
  }

  const rc = byId("reminderCinema");
  if (rc) rc.textContent = bk.cinema;

  generateQR(bk.bookingId, bk, bk.title);

  byId("downloadBtn")?.addEventListener("click", () => window.print());
  byId("shareTicketBtn")?.addEventListener("click", () => shareTicket(bk.title, bk.bookingId));

  safeHideLoader();
}

function generateQR(bid, bk, title) {
  const qrEl = byId("qrCode");
  if (!qrEl) return;

  const txt = [
    "BookMyShow",
    `ID:${bid}`,
    title || bk.title,
    bk.cinema,
    `${bk.date} ${bk.time}`,
    `Seats:${(bk.seats || []).join(",")}`,
    `₹${bk.total}`
  ].join("|");

  if (typeof QRCode !== "undefined") {
    qrEl.innerHTML = "";
    new QRCode(qrEl, {
      text: txt,
      width: 100,
      height: 100,
      colorDark: "#ffffff",
      colorLight: "#111120",
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrEl.innerHTML = makeSVGQR(bid || "MZ0000");
  }
}

function makeSVGQR(id) {
  const safeId = String(id || "MZ0000");
  const sz = 100;
  const cells = 25;
  const cell = sz / cells;
  let rects = "";

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const corner =
        (r < 7 && c < 7) ||
        (r < 7 && c > cells - 8) ||
        (r > cells - 8 && c < 7);

      const hash =
        (safeId.charCodeAt((r * cells + c) % Math.max(safeId.length, 1)) + r * 7 + c * 3) % 3 === 0;

      if (corner || hash) {
        rects += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="white"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}"><rect width="${sz}" height="${sz}" fill="#111120"/>${rects}</svg>`;
}

async function shareTicket(title, bid) {
  const msg = `🎫 BookMyShow Ticket\n${title}\nBooking ID: ${bid}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: `My Ticket — ${title}`,
        text: msg,
        url: location.href
      });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(msg);
      safeToast("Ticket info copied!", "success");
    } else {
      prompt("Copy your ticket info:", msg);
    }
  } catch (err) {
    console.warn("shareTicket error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  safeMountNavbar();
  safeInitNavSearch();
  initTicketPage();
});