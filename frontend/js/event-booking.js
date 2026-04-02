// js/event-booking.js
document.addEventListener("DOMContentLoaded", initEventBookingPage);

const EVENT_FOOD_MENU = [
  { id: "popcorn", name: "Popcorn (Large)", sub: "Classic butter popcorn", price: 180, emoji: "🍿", badge: "POPULAR" },
  { id: "coke", name: "Coke (500ml)", sub: "Chilled soft drink", price: 120, emoji: "🥤", badge: "" },
  { id: "nachos", name: "Nachos + Dip", sub: "Crispy nachos combo", price: 200, emoji: "🧂", badge: "" },
  { id: "combo1", name: "Combo 1", sub: "Popcorn + Coke combo", price: 280, emoji: "🎬", badge: "POPULAR" },
  { id: "icecream", name: "Ice Cream", sub: "Vanilla cup", price: 100, emoji: "🍦", badge: "" }
];

let currentEventData = null;
let eventFoodCart = {};

function safeToast(message, type = "info", ms = 3000) {
  if (
    typeof window.TOAST !== "undefined" &&
    window.TOAST &&
    typeof window.TOAST.show === "function"
  ) {
    window.TOAST.show(message, type, ms);
  } else {
    console.log(`[${type}] ${message}`);
  }
}

function getCurrentCity() {
  return localStorage.getItem("mz_city") || "Mumbai";
}

function getLastEventBooking() {
  try {
    return JSON.parse(localStorage.getItem("mz_last_event_booking") || "{}");
  } catch (err) {
    return {};
  }
}

function getAllEventBookings() {
  try {
    return JSON.parse(localStorage.getItem("mz_event_bookings") || "[]");
  } catch (err) {
    return [];
  }
}

function saveEventBooking(entry) {
  try {
    const all = getAllEventBookings();
    all.unshift(entry);
    localStorage.setItem("mz_event_bookings", JSON.stringify(all));
  } catch (err) {
    console.error("Failed to save event booking:", err);
  }
}

function safeMountNavbar() {
  if (typeof window.mountNavbar === "function") {
    try {
      window.mountNavbar("events");
    } catch (err) {
      console.warn("Navbar mount failed:", err);
    }
  }
}

function safeHideLoader() {
  const loader = document.getElementById("pageLoader");
  if (!loader) return;

  if (typeof window.hideLoader === "function") {
    try {
      window.hideLoader();
      return;
    } catch (err) {
      console.warn("hideLoader failed:", err);
    }
  }

  setTimeout(function () {
    loader.classList.add("gone");
    setTimeout(function () {
      loader.style.display = "none";
    }, 500);
  }, 250);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function initEventBookingPage() {
  safeMountNavbar();

  const container = document.getElementById("eventBookingContainer");
  if (!container) {
    safeHideLoader();
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (
    id &&
    typeof window.API !== "undefined" &&
    window.API &&
    typeof window.API.get === "function"
  ) {
    try {
      const res = await window.API.get(`/events/${id}`);
      if (res && res.success && res.event) {
        currentEventData = normalizeEvent(res.event, params);
        renderEventBooking(currentEventData);
        safeHideLoader();
        return;
      }
    } catch (err) {
      console.error("Failed API event load:", err);
    }
  }

  const last = getLastEventBooking();

  const fallbackEvent = {
    _id: id || last.eventId || last.id || "",
    title: params.get("name") || last.title || last.name || "Unknown Event",
    category: params.get("category") || last.category || "Live Event",
    city: params.get("city") || last.city || getCurrentCity(),
    venue: params.get("venue") || last.venue || "Venue TBA",
    date: params.get("date") || last.date || "Coming Soon",
    price: Number(params.get("price") || last.price || 0),
    description:
      params.get("description") ||
      last.description ||
      "Premium live event experience"
  };

  if (!fallbackEvent.title || fallbackEvent.title === "Unknown Event") {
    container.innerHTML = `
      <div class="empty" style="text-align:center;padding:40px">
        <div class="empty-ico">🎫</div>
        <div class="empty-txt">Event not found</div>
        <div class="empty-sub">Invalid event data.</div>
      </div>
    `;
    safeHideLoader();
    return;
  }

  currentEventData = fallbackEvent;
  renderEventBooking(currentEventData);
  safeHideLoader();
}

function normalizeEvent(event, params) {
  return {
    _id: event._id || event.id || params.get("id") || "",
    title: event.title || event.name || params.get("name") || "Unknown Event",
    category: event.category || params.get("category") || "Live Event",
    city: event.city || params.get("city") || getCurrentCity(),
    venue: event.venue || params.get("venue") || "Venue TBA",
    date: event.date || params.get("date") || "Coming Soon",
    price: Number(event.price || params.get("price") || 0),
    description: event.description || params.get("description") || "Premium live event experience"
  };
}

function renderFoodCards() {
  return EVENT_FOOD_MENU.map(function (item) {
    return `
      <div style="
        background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.025));
        border:1px solid rgba(255,255,255,.08);
        border-radius:16px;
        overflow:hidden;
        min-height:140px;
      ">
        <div style="padding:10px 12px;background:rgba(70,90,180,.14);display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:2rem">${item.emoji}</div>
          ${item.badge ? `<div style="font-size:.62rem;background:#ff183f;color:#fff;padding:2px 6px;border-radius:999px;font-weight:700">${item.badge}</div>` : `<div></div>`}
        </div>

        <div style="padding:12px">
          <div style="font-weight:700;font-size:.9rem">${item.name}</div>
          <div style="font-size:.72rem;color:var(--muted);margin-top:4px">${item.sub}</div>
          <div style="margin-top:10px;font-weight:800;color:var(--gold)">₹${item.price}</div>

          <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:10px">
            <div style="display:flex;align-items:center;gap:6px">
              <button type="button" onclick="changeEventFoodQty('${item.id}',-1)" style="width:28px;height:28px;border:none;border-radius:8px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer">−</button>
              <span id="foodQty_${item.id}" style="min-width:16px;text-align:center;font-weight:700">0</span>
              <button type="button" onclick="changeEventFoodQty('${item.id}',1)" style="width:28px;height:28px;border:none;border-radius:8px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer">+</button>
            </div>

            <button type="button" onclick="quickAddEventFood('${item.id}')" class="btn btn-red" style="padding:8px 14px;font-size:.78rem">Add</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderEventBooking(event) {
  const container = document.getElementById("eventBookingContainer");
  if (!container) return;

  const title = event.title || event.name || "Unknown Event";
  const category = event.category || "N/A";
  const city = event.city || "N/A";
  const venue = event.venue || "N/A";
  const date = event.date || "N/A";
  const price = Number(event.price || 0);
  const description = event.description || "No description available";

  container.innerHTML = `
    <div class="ev-layout" style="display:flex;gap:22px;align-items:flex-start">
      <div style="flex:1;min-width:0">
        <div style="
          background:rgba(255,255,255,.03);
          border:1px solid rgba(255,255,255,.08);
          border-radius:20px;
          padding:22px;
          margin-bottom:18px
        ">
          <div style="display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;align-items:flex-start">
            <div style="flex:1;min-width:260px">
              <div style="font-size:2rem;margin-bottom:8px">🎟️</div>
              <h1 style="margin:0 0 10px">${escapeHtml(title)}</h1>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
                <span style="padding:6px 10px;border-radius:999px;background:rgba(229,9,20,.15);border:1px solid rgba(229,9,20,.28);font-size:.75rem">${escapeHtml(category)}</span>
                <span style="padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);font-size:.75rem">${escapeHtml(city)}</span>
              </div>
              <p style="margin:0 0 8px"><b>Venue:</b> ${escapeHtml(venue)}</p>
              <p style="margin:0 0 8px"><b>Date:</b> ${escapeHtml(date)}</p>
              <p style="margin:0 0 8px"><b>Price per Ticket:</b> ₹${price}</p>
              <p style="margin:10px 0 0;color:var(--muted)">${escapeHtml(description)}</p>
            </div>

            <div style="
              width:250px;
              max-width:100%;
              background:rgba(255,255,255,.035);
              border:1px solid rgba(255,255,255,.08);
              border-radius:16px;
              padding:16px
            ">
              <div style="font-weight:800;margin-bottom:12px">Select Tickets</div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
                <span>Tickets</span>
                <input
                  type="number"
                  id="ticketQty"
                  min="1"
                  max="10"
                  value="1"
                  style="width:88px;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:#111;color:#fff"
                >
              </div>
              <div style="font-size:.72rem;color:var(--muted);margin-top:8px">Max 10 tickets per booking</div>
            </div>
          </div>
        </div>

        <div style="
          background:rgba(255,255,255,.03);
          border:1px solid rgba(229,9,20,.18);
          border-radius:20px;
          padding:18px;
          margin-bottom:18px
        ">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px">
            <div>
              <div style="font-weight:800">🍿 Add Food & Beverages</div>
              <div style="font-size:.78rem;color:var(--muted)">Pre-order food with your ticket</div>
            </div>
            <div style="font-size:.72rem;color:var(--muted)">Skip the queue!</div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
            ${renderFoodCards()}
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-top:14px">
            <div style="padding:14px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08)">
              <div style="font-weight:700;font-size:.85rem">🍿 Food Pre-Order</div>
              <div style="font-size:.76rem;color:var(--muted);margin-top:6px">
                Choose snacks, drinks and combos before payment for a smoother check-in experience.
              </div>
            </div>
            <div style="padding:14px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08)">
              <div style="font-weight:700;font-size:.85rem">💸 Split Bill with Friends</div>
              <div style="font-size:.76rem;color:var(--muted);margin-top:6px">
                Group booking friendly UI. You can extend this later with split payment links.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="ev-summary-col" style="width:320px;max-width:100%">
        <div style="
          position:sticky;
          top:90px;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.08);
          border-radius:18px;
          padding:18px
        ">
          <div style="font-size:1rem;font-weight:800;margin-bottom:10px">Booking Summary</div>

          <div style="margin-bottom:12px">
            <div style="font-size:.9rem;font-weight:700" id="summaryEventTitle">${escapeHtml(title)}</div>
            <div style="font-size:.76rem;color:var(--muted);margin-top:4px" id="summaryMeta">${escapeHtml(venue)}</div>
          </div>

          <div style="border-top:1px dashed rgba(255,255,255,.1);padding-top:12px;margin-top:12px">
            <div style="font-size:.72rem;color:var(--muted);margin-bottom:8px">TICKETS</div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span>Qty</span>
              <strong id="summaryTicketQty">1</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span>Ticket Price</span>
              <strong id="eventUnitPrice">₹${price}</strong>
            </div>
          </div>

          <div style="border-top:1px dashed rgba(255,255,255,.1);padding-top:12px;margin-top:12px">
            <div style="font-size:.72rem;color:var(--muted);margin-bottom:8px">FOOD & BEVERAGES</div>
            <div id="foodSelectedList" style="font-size:.78rem;color:var(--muted);margin-bottom:8px">No food selected</div>
          </div>

          <div style="border-top:1px dashed rgba(255,255,255,.1);padding-top:12px;margin-top:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span>Subtotal</span>
              <strong id="eventSubtotal">₹${price}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span>Food & Beverages</span>
              <strong id="eventFoodTotal">₹0</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span>Convenience Fee (4%)</span>
              <strong id="eventConvFee">₹${Math.round(price * 0.04)}</strong>
            </div>
          </div>

          <div style="border-top:1px dashed rgba(255,255,255,.12);padding-top:12px;display:flex;justify-content:space-between;font-size:1rem;font-weight:800">
            <span>Total Amount</span>
            <strong id="eventGrandTotal">₹${price + Math.round(price * 0.04)}</strong>
          </div>

          <button
            id="confirmEventBookingBtn"
            class="btn btn-red"
            type="button"
            style="width:100%;margin-top:14px"
          >
            Proceed to Payment →
          </button>

          <div style="font-size:.72rem;color:var(--muted);margin-top:10px;text-align:center">
            Book now and earn loyalty points!
          </div>
        </div>
      </div>
    </div>
  `;

  bindEventBookingHandlers();
  updateEventBookingTotals();
}

function bindEventBookingHandlers() {
  const qtyInput = document.getElementById("ticketQty");
  const confirmBtn = document.getElementById("confirmEventBookingBtn");

  if (qtyInput) {
    qtyInput.addEventListener("input", updateEventBookingTotals);
    qtyInput.addEventListener("change", updateEventBookingTotals);
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      if (!currentEventData) return;
      confirmEventBooking(
        currentEventData._id || "",
        currentEventData.price || 0,
        currentEventData
      );
    });
  }
}

function quickAddEventFood(id) {
  changeEventFoodQty(id, 1);
}

function changeEventFoodQty(id, delta) {
  const current = eventFoodCart[id] || 0;
  const next = Math.max(0, current + delta);

  if (next === 0) {
    delete eventFoodCart[id];
  } else {
    eventFoodCart[id] = next;
  }

  const qtyEl = document.getElementById(`foodQty_${id}`);
  if (qtyEl) qtyEl.textContent = String(eventFoodCart[id] || 0);

  updateEventBookingTotals();
}

function getFoodTotal() {
  return Object.entries(eventFoodCart).reduce(function (sum, entry) {
    const id = entry[0];
    const qty = entry[1];
    const item = EVENT_FOOD_MENU.find(function (x) { return x.id === id; });
    return sum + ((item ? item.price : 0) * qty);
  }, 0);
}

function getFoodSummaryText() {
  const parts = Object.entries(eventFoodCart)
    .filter(function (entry) { return entry[1] > 0; })
    .map(function (entry) {
      const id = entry[0];
      const qty = entry[1];
      const item = EVENT_FOOD_MENU.find(function (x) { return x.id === id; });
      return item ? `${item.emoji} ${item.name} x${qty}` : null;
    })
    .filter(Boolean);

  return parts.length ? parts.join(", ") : "No food selected";
}

function updateEventBookingTotals() {
  if (!currentEventData) return;

  const price = Number(currentEventData.price || 0);
  const qtyInput = document.getElementById("ticketQty");

  const qty = Math.max(
    1,
    Math.min(10, parseInt((qtyInput && qtyInput.value) || "1", 10) || 1)
  );

  if (qtyInput) qtyInput.value = qty;

  const subtotal = qty * price;
  const foodTotal = getFoodTotal();
  const convenienceFee = Math.round((subtotal + foodTotal) * 0.04);
  const grandTotal = subtotal + foodTotal + convenienceFee;

  const subtotalEl = document.getElementById("eventSubtotal");
  const foodTotalEl = document.getElementById("eventFoodTotal");
  const convFeeEl = document.getElementById("eventConvFee");
  const totalEl = document.getElementById("eventGrandTotal");
  const qtyEl = document.getElementById("summaryTicketQty");
  const foodListEl = document.getElementById("foodSelectedList");

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
  if (foodTotalEl) foodTotalEl.textContent = `₹${foodTotal}`;
  if (convFeeEl) convFeeEl.textContent = `₹${convenienceFee}`;
  if (totalEl) totalEl.textContent = `₹${grandTotal}`;
  if (qtyEl) qtyEl.textContent = String(qty);
  if (foodListEl) foodListEl.textContent = getFoodSummaryText();
}

function confirmEventBooking(eventId, price, meta = {}) {
  const qty = Math.max(
    1,
    Math.min(
      10,
      parseInt(document.getElementById("ticketQty")?.value || "1", 10) || 1
    )
  );

  const subtotal = qty * Number(price || 0);
  const foodTotal = getFoodTotal();
  const convenienceFee = Math.round((subtotal + foodTotal) * 0.04);
  const total = subtotal + foodTotal + convenienceFee;

  const bookingId = "EVBK" + Date.now();

  const booking = {
    bookingId: bookingId,
    _id: bookingId,
    id: bookingId,
    eventId: eventId || "",
    type: "event",
    title: meta.title || "Unknown Event",
    eventTitle: meta.title || "Unknown Event",
    category: meta.category || "",
    city: meta.city || getCurrentCity(),
    venue: meta.venue || "",
    cinema: meta.venue || "",
    date: meta.date || "",
    time: meta.time || "7:00 PM",
    description: meta.description || "",
    qty: qty,
    seats: [`Tickets x${qty}`],
    seatCategory: "Event Pass",
    price: Number(price || 0),
    subtotal: subtotal,
    foodItems: { ...eventFoodCart },
    foodTotal: foodTotal,
    convenienceFee: convenienceFee,
    total: total,
    totalAmount: total,
    bookedAt: new Date().toISOString(),
    status: "confirmed",
    loyaltyPointsEarned: Math.max(10, Math.floor(total / 20)),
    userName: (() => {
      try {
        if (window.SESSION && typeof window.SESSION.getUser === "function") {
          return window.SESSION.getUser()?.name || "Guest";
        }
      } catch (e) {}
      return "Guest";
    })()
  };

  saveEventBooking(booking);
  localStorage.setItem("mz_last_event_booking", JSON.stringify(booking));
  localStorage.setItem("mz_last_ticket", JSON.stringify(booking));
  sessionStorage.setItem("mz_lastBk", bookingId);

  safeToast(`Booking confirmed. Total: ₹${total}`, "success", 3200);

  setTimeout(function () {
    location.href = `ticket.html?id=${encodeURIComponent(bookingId)}`;
  }, 700);
}

window.confirmEventBooking = confirmEventBooking;
window.changeEventFoodQty = changeEventFoodQty;
window.quickAddEventFood = quickAddEventFood;