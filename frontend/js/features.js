// ============================================================
// features.js — FINAL MERGED & FIXED (ALL 5 FEATURES WORKING)
// 1. Food Pre-Order  2. Voice Search  3. Rewards  4. Chatbot  5. Calendar
// ============================================================

(function () {
  "use strict";

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SAFE HELPERS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function safeToast(msg, type = "info", ms = 2600) {
    if (typeof window.TOAST !== "undefined" && window.TOAST && typeof window.TOAST.show === "function") {
      window.TOAST.show(msg, type, ms);
    } else {
      console.log(`[${type}] ${msg}`);
    }
  }

  function isLoggedInSafe() {
    if (typeof window.SESSION !== "undefined" && window.SESSION && typeof window.SESSION.isLoggedIn === "function") {
      return window.SESSION.isLoggedIn();
    }
    return !!localStorage.getItem("mz_token");
  }

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeAPIGet(url) {
    if (typeof window.API !== "undefined" && window.API && typeof window.API.get === "function") {
      return window.API.get(url);
    }
    return Promise.reject(new Error("API not available"));
  }

  function appendStyleOnce(id, cssText) {
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = cssText;
    document.head.appendChild(style);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FEATURE 1: FOOD PRE-ORDER SYSTEM
     conflict-safe with booking.js
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const FOOD_ITEMS = [
    { id: "pc", name: "Popcorn Combo", desc: "Large popcorn + Coke 500ml", price: 249, emoji: "🍿", popular: true },
    { id: "nc", name: "Nachos + Coke", desc: "Nachos with cheese dip + Coke", price: 199, emoji: "🧂", popular: false },
    { id: "bc", name: "Burger Combo", desc: "Veg burger + fries + Pepsi", price: 299, emoji: "🍔", popular: false },
    { id: "cf", name: "Cafe Latte", desc: "Hot coffee, freshly brewed", price: 149, emoji: "☕", popular: false },
    { id: "ic", name: "Ice Cream", desc: "2 scoops chocolate/vanilla", price: 129, emoji: "🍦", popular: false },
    { id: "sp", name: "Spring Rolls", desc: "Crispy spring rolls x6", price: 179, emoji: "🥟", popular: false }
  ];

  var _featFoodCart = {};

  function getActiveFoodCart() {
    if (typeof window.foodCart !== "undefined" && window.foodCart && typeof window.foodCart === "object") {
      return window.foodCart;
    }
    return _featFoodCart;
  }

  function initFoodPreOrder() {
    if (!document.getElementById("bookingPage")) return;

    appendStyleOnce("feature-food-style", `
      .food-po-section {
        background: #0d1117;
        border: 1px solid rgba(229,9,20,.2);
        border-radius: 10px;
        padding: 20px;
        margin-top: 20px;
      }
      .food-po-title {
        font-family: 'Rajdhani', sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .food-po-sub {
        font-size: .78rem;
        color: #888;
        margin-bottom: 16px;
      }
      .food-cards-wrap {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }
      .food-card-item {
        background: #161b22;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 8px;
        overflow: hidden;
        transition: transform .25s, border-color .25s, box-shadow .25s;
        cursor: pointer;
        position: relative;
      }
      .food-card-item:hover {
        transform: translateY(-5px);
        border-color: rgba(229,9,20,.4);
        box-shadow: 0 10px 30px rgba(0,0,0,.6);
      }
      .food-card-img {
        height: 90px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.8rem;
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        position: relative;
      }
      .food-popular-tag {
        position: absolute;
        top: 6px;
        left: 6px;
        background: #e50914;
        color: #fff;
        font-size: .58rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 3px;
        letter-spacing: .4px;
      }
      .food-card-body { padding: 10px; }
      .food-card-name { font-size: .82rem; font-weight: 700; margin-bottom: 2px; }
      .food-card-desc { font-size: .68rem; color: #888; margin-bottom: 7px; line-height: 1.4; }
      .food-card-price { font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 700; color: #e5b80b; margin-bottom: 8px; }
      .food-card-actions { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
      .food-qty-wrap { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,.06); border-radius: 4px; padding: 3px 7px; }
      .food-qty-btn {
        width: 22px; height: 22px; border-radius: 3px; background: rgba(255,255,255,.1);
        border: none; color: #fff; font-size: .9rem; cursor: pointer;
        display: flex; align-items: center; justify-content: center; transition: background .15s;
      }
      .food-qty-btn:hover { background: #e50914; }
      .food-qty-num { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: .95rem; min-width: 16px; text-align: center; }
      .food-add-btn {
        background: #e50914; color: #fff; border: none; padding: 5px 12px;
        border-radius: 4px; font-size: .74rem; font-weight: 700; cursor: pointer; transition: background .15s;
      }
      .food-add-btn:hover { background: #b81d24; }
      .food-add-btn.added { background: #46d369; }
      .food-cart-badge {
        position: absolute; top: 7px; right: 7px; background: #46d369; color: #000;
        width: 20px; height: 20px; border-radius: 50%; font-size: .65rem; font-weight: 700;
        display: none; align-items: center; justify-content: center;
      }
      .food-cart-badge.show { display: flex; }
    `);
  }

  function renderFoodSection(container) {
    if (!container || document.getElementById("foodPreOrderSection")) return;

    const sec = document.createElement("div");
    sec.id = "foodPreOrderSection";
    sec.className = "food-po-section";
    sec.innerHTML = `
      <div class="food-po-title">🍿 Add Food & Beverages</div>
      <div class="food-po-sub">Skip the queue — order food with your ticket!</div>
      <div class="food-cards-wrap" id="foodCardsGrid"></div>
      <div id="foodCartSummary" style="display:none; background:#161b22; border:1px solid rgba(229,9,20,.2); border-radius:6px; padding:12px; margin-top:8px;">
        <div style="font-size:.84rem; font-weight:700; margin-bottom:8px; color:#fff;">🛒 Your Food Order</div>
        <div id="foodCartItems"></div>
        <div style="border-top:1px solid rgba(255,255,255,.07); margin-top:8px; padding-top:8px; display:flex; justify-content:space-between; font-weight:700;">
          <span style="color:#888;">Food Total</span>
          <span style="color:#e5b80b;" id="foodTotalDisplay">₹0</span>
        </div>
      </div>
    `;
    container.appendChild(sec);

    const grid = sec.querySelector("#foodCardsGrid");
    FOOD_ITEMS.forEach(item => {
      const card = document.createElement("div");
      card.className = "food-card-item";
      card.innerHTML = `
        <div class="food-card-img">
          ${item.popular ? '<div class="food-popular-tag">⭐ POPULAR</div>' : ""}
          ${item.emoji}
        </div>
        <div class="food-card-body">
          <div class="food-card-name">${escapeHtml(item.name)}</div>
          <div class="food-card-desc">${escapeHtml(item.desc)}</div>
          <div class="food-card-price">₹${item.price}</div>
          <div class="food-card-actions">
            <div class="food-qty-wrap">
              <button class="food-qty-btn" onclick="changeFoodQty('${item.id}',-1)">−</button>
              <span class="food-qty-num" id="fq_${item.id}">0</span>
              <button class="food-qty-btn" onclick="changeFoodQty('${item.id}',1)">+</button>
            </div>
            <button class="food-add-btn" id="fadd_${item.id}" onclick="addFoodItem('${item.id}')">Add</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    updateFoodSummary();
  }

  window.changeFoodQty = function (id, delta) {
    const cart = getActiveFoodCart();
    const curr = cart[id] || 0;
    const next = Math.max(0, curr + delta);

    if (next === 0) delete cart[id];
    else cart[id] = next;

    const el = document.getElementById(`fq_${id}`);
    if (el) el.textContent = next;

    const addBtn = document.getElementById(`fadd_${id}`);
    if (addBtn) {
      addBtn.textContent = next > 0 ? `Added (${next})` : "Add";
      addBtn.classList.toggle("added", next > 0);
    }

    updateFoodSummary();

    if (typeof window.updateFoodCartSummary === "function") {
      try { window.updateFoodCartSummary(); } catch {}
    }
    if (typeof window.updateBookingTotal === "function" && window.updateBookingTotal !== updateBookingTotal) {
      try { window.updateBookingTotal(); } catch {}
    } else {
      updateBookingTotal();
    }
    if (typeof window.updatePanel === "function") {
      try { window.updatePanel(); } catch {}
    }
  };

  window.addFoodItem = function (id) {
    window.changeFoodQty(id, 1);
  };

  function updateFoodSummary() {
    const summaryEl = document.getElementById("foodCartSummary");
    const itemsEl = document.getElementById("foodCartItems");
    const totalEl = document.getElementById("foodTotalDisplay");
    if (!summaryEl) return;

    let total = 0;
    const cart = getActiveFoodCart();
    const entries = Object.entries(cart).filter(([, qty]) => qty > 0);

    if (!entries.length) {
      summaryEl.style.display = "none";
      if (totalEl) totalEl.textContent = "₹0";
      if (itemsEl) itemsEl.innerHTML = "";
      return;
    }

    summaryEl.style.display = "block";

    if (itemsEl) {
      itemsEl.innerHTML = entries.map(([id, qty]) => {
        const item = FOOD_ITEMS.find(f => f.id === id);
        if (!item) return "";
        total += item.price * qty;
        return `<div style="display:flex;justify-content:space-between;font-size:.8rem;padding:3px 0;color:#b3b3b3"><span>${item.emoji} ${escapeHtml(item.name)} x${qty}</span><span>₹${item.price * qty}</span></div>`;
      }).join("");
    }

    if (totalEl) totalEl.textContent = `₹${total}`;
  }

  function getFoodTotal() {
    const cart = getActiveFoodCart();
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = FOOD_ITEMS.find(f => f.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }

  function updateBookingTotal() {
    const foodRowEl = document.getElementById("panelFood");
    const grandEl = document.getElementById("panelGrand");
    const baseEl = document.getElementById("panelBase");
    const convEl = document.getElementById("panelConv");
    if (!grandEl) return;

    const base = parseInt(String(baseEl?.textContent || "0").replace(/[^\d]/g, ""), 10) || 0;
    const conv = parseInt(String(convEl?.textContent || "0").replace(/[^\d]/g, ""), 10) || 0;
    const food = getFoodTotal();

    if (foodRowEl) foodRowEl.textContent = `₹${food}`;
    grandEl.textContent = `₹${base + conv + food}`;
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FEATURE 2: VOICE SEARCH UI
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function initVoiceSearch() {
    appendStyleOnce("feature-voice-style", `
      .voice-modal-overlay {
        display: none; position: fixed; inset: 0; z-index: 5000;
        background: rgba(0,0,0,.92); backdrop-filter: blur(20px);
        align-items: center; justify-content: center; flex-direction: column;
      }
      .voice-modal-overlay.open { display: flex; animation: vsIn .3s ease; }
      @keyframes vsIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
      .voice-modal {
        text-align: center; padding: 44px 36px;
        background: #1a1a1a; border-radius: 16px;
        border: 1px solid rgba(229,9,20,.3);
        max-width: 420px; width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,.8);
      }
      .v-mic-ring {
        width: 110px; height: 110px; border-radius: 50%;
        background: #e50914; margin: 0 auto 22px;
        display: flex; align-items: center; justify-content: center;
        font-size: 2.6rem; cursor: pointer; transition: all .2s;
        box-shadow: 0 0 0 0 rgba(229,9,20,.4);
        border: none; color: #fff;
      }
      .v-mic-ring.listening {
        animation: mPulse 1.2s infinite;
        box-shadow: 0 0 0 12px rgba(229,9,20,.15);
      }
      @keyframes mPulse { 0%,100%{box-shadow:0 0 0 0 rgba(229,9,20,.4)} 70%{box-shadow:0 0 0 22px rgba(229,9,20,0)} }
      .v-status { font-family:'Rajdhani',sans-serif; font-size:1.45rem; font-weight:700; margin-bottom:6px; }
      .v-hint { font-size:.84rem; color:#888; margin-bottom:20px; line-height:1.6; }
      .sound-wave { display:flex; align-items:center; justify-content:center; gap:5px; height:44px; margin-bottom:18px; }
      .wave-bar { width:5px; border-radius:3px; background:#e50914; height:6px; transition:height .1s; }
      .wave-bar:nth-child(1){animation:wvB .7s ease-in-out infinite 0s}
      .wave-bar:nth-child(2){animation:wvB .7s ease-in-out infinite .1s}
      .wave-bar:nth-child(3){animation:wvB .7s ease-in-out infinite .2s}
      .wave-bar:nth-child(4){animation:wvB .7s ease-in-out infinite .1s}
      .wave-bar:nth-child(5){animation:wvB .7s ease-in-out infinite 0s}
      @keyframes wvB { 0%,100%{height:6px} 50%{height:32px} }
      .v-suggestions { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-top:14px; }
      .v-chip { padding:6px 14px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14); border-radius:20px; font-size:.78rem; cursor:pointer; transition:all .2s; color:#fff; }
      .v-chip:hover { background:#e50914; border-color:#e50914; }
      .v-close { margin-top:18px; font-size:.82rem; cursor:pointer; border:none; background:none; color:#888; }
      .v-close:hover { color:#fff; }
      .nav-mic-btn {
        position:absolute; right:6px; top:50%; transform:translateY(-50%);
        width:32px; height:32px; border-radius:50%; background:#e50914;
        display:flex; align-items:center; justify-content:center; font-size:.88rem;
        cursor:pointer; border:none; color:#fff; transition:all .2s;
      }
      .nav-mic-btn:hover { background:#b81d24; transform:translateY(-50%) scale(1.08); }
      .nav-mic-btn.active { animation:mPulse 1s infinite; }
      .nav-search-inp.listening { border-color:#e50914!important; box-shadow:0 0 0 2px rgba(229,9,20,.3)!important; }
    `);

    if (document.getElementById("voiceModal")) return;

    const modal = document.createElement("div");
    modal.className = "voice-modal-overlay";
    modal.id = "voiceModal";
    modal.innerHTML = `
      <div class="voice-modal">
        <button class="v-mic-ring" id="vMicCircle">🎤</button>
        <div class="v-status" id="vStatus">Speak Now</div>
        <div class="v-hint" id="vHint">Try saying: "Show action movies in Mumbai"</div>
        <div class="sound-wave" id="soundWave" style="display:none">
          <div class="wave-bar"></div><div class="wave-bar"></div>
          <div class="wave-bar"></div><div class="wave-bar"></div>
          <div class="wave-bar"></div>
        </div>
        <div class="v-suggestions">
          <div class="v-chip" onclick="voiceSearch('Action movies')">💥 Action</div>
          <div class="v-chip" onclick="voiceSearch('Horror movies')">👻 Horror</div>
          <div class="v-chip" onclick="voiceSearch('Comedy movies')">😂 Comedy</div>
          <div class="v-chip" onclick="voiceSearch('Thriller movies')">🔍 Thriller</div>
          <div class="v-chip" onclick="voiceSearch('Sci-Fi movies')">🚀 Sci-Fi</div>
        </div>
        <button class="v-close" onclick="closeVoiceModal()">✕ Close</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", e => {
      if (e.target === modal) closeVoiceModal();
    });

    const micCircle = document.getElementById("vMicCircle");
    if (micCircle) micCircle.addEventListener("click", startListening);
  }

  function injectMicToNavbar() {
    const wrap = document.querySelector(".nav-search-wrap");
    const inp = document.querySelector(".nav-search-inp");
    if (!wrap || !inp || document.querySelector(".nav-mic-btn")) return;

    inp.style.paddingRight = "42px";

    const mic = document.createElement("button");
    mic.className = "nav-mic-btn";
    mic.id = "navMicBtn";
    mic.innerHTML = "🎤";
    mic.title = "Voice Search";
    mic.type = "button";
    mic.onclick = openVoiceModal;
    wrap.appendChild(mic);
  }

  function openVoiceModal() {
    const modal = document.getElementById("voiceModal");
    if (!modal) return;
    modal.classList.add("open");
    startListening();
  }

  function closeVoiceModal() {
    const modal = document.getElementById("voiceModal");
    if (modal) modal.classList.remove("open");
    stopListening();
  }

  let recognition = null;

  function startListening() {
    const micBtn = document.getElementById("navMicBtn");
    const micCircle = document.getElementById("vMicCircle");
    const inp = document.querySelector(".nav-search-inp");
    const wave = document.getElementById("soundWave");
    const statusEl = document.getElementById("vStatus");
    const hintEl = document.getElementById("vHint");

    if (micBtn) micBtn.classList.add("active");
    if (micCircle) micCircle.classList.add("listening");
    if (inp) inp.classList.add("listening");
    if (wave) wave.style.display = "flex";
    if (statusEl) statusEl.textContent = "Listening...";
    if (hintEl) hintEl.textContent = "🎤 Speak clearly near the microphone";

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      try {
        if (recognition) recognition.stop();
      } catch {}

      recognition = new SR();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = e => {
        const text = e.results?.[0]?.[0]?.transcript || "";
        if (inp) inp.value = text;
        window.voiceSearch(text);
      };
      recognition.onerror = () => {
        if (statusEl) statusEl.textContent = "Could not hear. Try again!";
        setTimeout(stopListening, 1500);
      };
      recognition.onend = () => stopListening();

      try {
        recognition.start();
      } catch {}
    } else {
      setTimeout(() => {
        if (statusEl) statusEl.textContent = "Tap a suggestion below!";
      }, 800);
    }
  }

  function stopListening() {
    if (recognition) {
      try { recognition.stop(); } catch {}
      recognition = null;
    }

    const micBtn = document.getElementById("navMicBtn");
    const micCircle = document.getElementById("vMicCircle");
    const inp = document.querySelector(".nav-search-inp");
    const wave = document.getElementById("soundWave");
    const statusEl = document.getElementById("vStatus");
    const hintEl = document.getElementById("vHint");

    if (micBtn) micBtn.classList.remove("active");
    if (micCircle) micCircle.classList.remove("listening");
    if (inp) inp.classList.remove("listening");
    if (wave) wave.style.display = "none";
    if (statusEl) statusEl.textContent = "Speak Now";
    if (hintEl) hintEl.textContent = 'Try saying: "Show action movies in Mumbai"';
  }

  window.voiceSearch = function (query) {
    const inp = document.querySelector(".nav-search-inp");
    if (inp) inp.value = query || "";
    closeVoiceModal();
    safeToast(`Searching: "${query}"`, "info");
    setTimeout(() => {
      location.href = `search.html?q=${encodeURIComponent(query || "")}`;
    }, 400);
  };

  window.closeVoiceModal = closeVoiceModal;
  window.openVoiceModal = openVoiceModal;

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FEATURE 3: REWARD POINTS SYSTEM
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function initRewardsSystem() {
    appendStyleOnce("feature-rewards-style", `
      .rw-wallet {
        background: linear-gradient(135deg, #0d1117 0%, #1a2035 50%, #0f1923 100%);
        border: 1px solid rgba(229,184,11,.28);
        border-radius: 12px; padding: 22px; margin-bottom: 18px;
        position: relative; overflow: hidden;
      }
      .rw-wallet::before {
        content:''; position:absolute; top:-60%; left:-30%;
        width:200%; height:200%;
        background: linear-gradient(45deg, transparent 40%, rgba(255,215,0,.04) 50%, transparent 60%);
        animation: rwShine 5s ease-in-out infinite;
        background-size: 200% 200%;
      }
      @keyframes rwShine { 0%{background-position:-200% center} 100%{background-position:200% center} }
      .rw-wallet.gold-tier { border-color: rgba(229,184,11,.5); background: linear-gradient(135deg,#1a1000,#2a1c00,#1a1000); }
      .rw-wallet.platinum-tier { border-color: rgba(185,242,255,.4); background: linear-gradient(135deg,#0a101a,#111b2e,#0a1018); }
      .rw-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
      .rw-pts-label { font-size:.74rem; color:#808080; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; }
      .rw-pts-value { font-family:'Bebas Neue',sans-serif; font-size:2.8rem; color:#e5b80b; letter-spacing:2px; line-height:1; }
      .rw-pts-sub { font-size:.72rem; color:#808080; margin-top:2px; }
      .rw-badge { padding:5px 14px; border-radius:20px; font-size:.74rem; font-weight:700; display:inline-flex; align-items:center; gap:5px; }
      .rw-badge.silver { background:rgba(192,192,192,.14); border:1px solid rgba(192,192,192,.4); color:#c0c0c0; }
      .rw-badge.gold { background:rgba(229,184,11,.14); border:1px solid rgba(229,184,11,.4); color:#e5b80b; }
      .rw-badge.platinum { background:rgba(185,242,255,.1); border:1px solid rgba(185,242,255,.36); color:#b9f2ff; }
      .rw-prog-section { margin-bottom:18px; }
      .rw-prog-label { display:flex; justify-content:space-between; font-size:.76rem; color:#808080; margin-bottom:7px; }
      .rw-prog-bar { height:7px; background:rgba(255,255,255,.1); border-radius:4px; overflow:hidden; }
      .rw-prog-fill { height:100%; background:linear-gradient(90deg,#e5b80b,#ff8c00); border-radius:4px; width:0; transition:width 1.2s ease; }
      .rw-breakdown { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:16px; }
      .rw-br-item { background:rgba(255,255,255,.05); border-radius:6px; padding:10px; text-align:center; }
      .rw-br-num { font-family:'Rajdhani',sans-serif; font-size:1.1rem; font-weight:700; color:#e5b80b; }
      .rw-br-lbl { font-size:.62rem; color:#808080; margin-top:2px; line-height:1.4; }
      .rw-actions { display:flex; gap:9px; margin-bottom:18px; }
      .rw-coupons-title { font-size:.76rem; color:#808080; font-weight:700; letter-spacing:.5px; text-transform:uppercase; margin-bottom:10px; }
      .rw-coupon-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
      .rw-coupon-item {
        background:rgba(255,255,255,.03); border:1px dashed rgba(255,255,255,.12);
        border-radius:8px; padding:11px; cursor:pointer; transition:all .2s;
        display:flex; align-items:center; gap:9px;
      }
      .rw-coupon-item:hover { background:rgba(229,9,20,.08); border-color:rgba(229,9,20,.4); }
      .rw-coupon-ico { font-size:1.5rem; flex-shrink:0; }
      .rw-coupon-pts { font-size:.68rem; color:#e5b80b; font-weight:700; margin-bottom:1px; }
      .rw-coupon-name { font-size:.78rem; font-weight:600; color:#fff; }
    `);
  }

  function renderRewardsCard(container, points = 0) {
    if (!container) return;

    const tier = points >= 1000 ? "platinum" : points >= 500 ? "gold" : "silver";
    const tierLabel = tier === "platinum" ? "💎 Platinum" : tier === "gold" ? "🥇 Gold" : "🥈 Silver";
    const nextTier = tier === "silver"
      ? { name: "Gold", target: 500 }
      : tier === "gold"
        ? { name: "Platinum", target: 1000 }
        : { name: "Platinum", target: 1000 };
    const progress = Math.min(100, Math.round((points / nextTier.target) * 100));

    const bkPts = Math.floor(points * 0.7);
    const foodPts = Math.floor(points * 0.2);
    const bonusPts = points - bkPts - foodPts;

    const coupons = [
      { ico: "🎟", pts: "100 pts", name: "₹50 Off Ticket" },
      { ico: "🍿", pts: "250 pts", name: "Free Popcorn" },
      { ico: "💰", pts: "500 pts", name: "₹200 Off" },
      { ico: "⬆️", pts: "750 pts", name: "Seat Upgrade" }
    ];

    container.innerHTML = `
      <div class="rw-wallet ${tier}-tier">
        <div class="rw-top">
          <div>
            <div class="rw-pts-label">My Rewards</div>
            <div class="rw-pts-value" id="rwPtsCounter">0</div>
            <div class="rw-pts-sub">Points</div>
          </div>
          <div class="rw-badge ${tier}">${tierLabel}</div>
        </div>
        <div class="rw-prog-section">
          <div class="rw-prog-label">
            <span>${points} / ${nextTier.target} pts to ${nextTier.name}</span>
            <span>${progress}%</span>
          </div>
          <div class="rw-prog-bar"><div class="rw-prog-fill" id="rwProgFill"></div></div>
        </div>
        <div class="rw-breakdown">
          <div class="rw-br-item"><div class="rw-br-num">+${bkPts}</div><div class="rw-br-lbl">From Bookings</div></div>
          <div class="rw-br-item"><div class="rw-br-num">+${foodPts}</div><div class="rw-br-lbl">Food Orders</div></div>
          <div class="rw-br-item"><div class="rw-br-num">+${bonusPts}</div><div class="rw-br-lbl">Bonus</div></div>
        </div>
        <div class="rw-actions">
          <button class="btn btn-red btn-sm" onclick="(window.TOAST&&TOAST.show)?TOAST.show('Reward redemption coming soon!','info'):alert('Reward redemption coming soon!')">🎁 Redeem Now</button>
          <button class="btn btn-glass btn-sm" onclick="(window.TOAST&&TOAST.show)?TOAST.show('Points history coming soon!','info'):alert('Points history coming soon!')">📋 View History</button>
        </div>
        <div class="rw-coupons-title">🎫 Redeem Coupons</div>
        <div class="rw-coupon-grid">
          ${coupons.map(c => `
            <div class="rw-coupon-item" onclick="redeemCoupon('${escapeHtml(c.name)}','${escapeHtml(c.pts)}',${points})">
              <div class="rw-coupon-ico">${c.ico}</div>
              <div><div class="rw-coupon-pts">${c.pts}</div><div class="rw-coupon-name">${escapeHtml(c.name)}</div></div>
            </div>`).join("")}
        </div>
      </div>
    `;

    const counterEl = container.querySelector("#rwPtsCounter");
    if (counterEl) {
      let current = 0;
      const step = Math.max(1, Math.ceil(points / 40));
      const timer = setInterval(() => {
        current = Math.min(current + step, points);
        counterEl.textContent = current.toLocaleString("en-IN");
        if (current >= points) clearInterval(timer);
      }, 30);
    }

    setTimeout(() => {
      const fill = container.querySelector("#rwProgFill");
      if (fill) fill.style.width = progress + "%";
    }, 300);
  }

  window.redeemCoupon = function (name, pts, userPts) {
    const needed = parseInt(String(pts).replace(/[^\d]/g, ""), 10) || 0;
    if (userPts < needed) {
      safeToast(`You need ${needed} pts for this reward. You have ${userPts} pts.`, "warn");
    } else {
      safeToast(`✅ "${name}" redeemed! Coupon sent to your email.`, "success");
    }
  };

  window.renderRewardsCard = renderRewardsCard;

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FEATURE 4: AI CHATBOT MOVIE ASSISTANT
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const BOT_RESPONSES = {
    action:   { text: "Here are tonight's top Action picks! 🔥", genre: "Action" },
    thriller: { text: "Edge-of-seat Thrillers under 2hrs 🎭", genre: "Thriller" },
    romantic: { text: "Perfect Romantic films for tonight ❤️", genre: "Romance" },
    comedy:   { text: "Laugh-out-loud Comedies for you 😂", genre: "Comedy" },
    horror:   { text: "Spooky Horror picks — watch alone? 👻", genre: "Horror" },
    family:   { text: "Great Family movies everyone will love 👨‍👩‍👧", genre: "Drama" },
    weekend:  { text: "Best picks for this weekend! 🎬", genre: "Action" },
    cheap:    { text: "Budget-friendly shows with morning discounts! 🎟", genre: "Comedy" },
    morning:  { text: "☀️ Morning shows (before 12 PM) are 30% cheaper!", genre: "Action" },
    default:  { text: "I found some great movies for you! 🎬", genre: "Action" }
  };

  const BOT_TIPS = [
    "💡 Morning shows are 30% cheaper!",
    "🏆 Use 100 reward points for ₹50 off your next booking",
    "🍿 Pre-order food to skip the counter queue",
    "⚡ IMAX screens are available at select theatres",
    "🎟 Book 2+ tickets and earn double points!"
  ];

  let chatMovies = [];
  let chatMsgCount = 0;

  function initChatbot() {
    appendStyleOnce("feature-chatbot-style", `
      .chatbot-fab {
        position:fixed; bottom:28px; right:28px; z-index:800;
        width:58px; height:58px; border-radius:50%;
        background:#e50914; border:none; color:#fff;
        display:flex; align-items:center; justify-content:center;
        font-size:1.5rem; cursor:pointer; transition:all .3s;
        box-shadow:0 4px 20px rgba(229,9,20,.5);
      }
      .chatbot-fab:hover { transform:scale(1.1); box-shadow:0 8px 28px rgba(229,9,20,.6); }
      .chatbot-fab .cb-unread {
        position:absolute; top:-4px; right:-4px;
        width:19px; height:19px; border-radius:50%;
        background:#e5b80b; color:#000;
        font-size:.62rem; font-weight:700;
        display:flex; align-items:center; justify-content:center;
      }
      .chatbot-win {
        position:fixed; bottom:100px; right:28px; z-index:800;
        width:370px; max-height:560px;
        background:#1a1a1a; border:1px solid rgba(255,255,255,.1);
        border-radius:14px; display:flex; flex-direction:column;
        box-shadow:0 20px 60px rgba(0,0,0,.9);
        transition:all .3s; transform-origin:bottom right;
      }
      .chatbot-win.hidden { opacity:0; transform:scale(.88) translateY(20px); pointer-events:none; }
      .chatbot-win.visible { opacity:1; transform:scale(1) translateY(0); }
      .cb-head {
        background:linear-gradient(135deg,#e50914,#b81d24);
        padding:13px 16px; display:flex; align-items:center; gap:11px;
        border-radius:14px 14px 0 0; flex-shrink:0;
      }
      .cb-av { width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; font-size:1.1rem; }
      .cb-head-info { flex:1; }
      .cb-head-title { font-weight:700; font-size:.9rem; }
      .cb-head-sub { font-size:.7rem; opacity:.8; }
      .cb-online::before { content:''; display:inline-block; width:7px; height:7px; border-radius:50%; background:#46d369; margin-right:4px; }
      .cb-close { background:none; border:none; color:#fff; font-size:1.1rem; cursor:pointer; opacity:.8; padding:4px; }
      .cb-body { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:11px; }
      .cb-body::-webkit-scrollbar { width:3px; }
      .cb-body::-webkit-scrollbar-thumb { background:#333; border-radius:2px; }
      .cb-msg { display:flex; gap:8px; animation:cbFadeIn .3s ease; max-width:90%; }
      .cb-msg.user { flex-direction:row-reverse; align-self:flex-end; }
      .cb-msg.bot { align-self:flex-start; }
      @keyframes cbFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      .cb-av-sm { width:26px; height:26px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:.76rem; margin-top:auto; }
      .cb-av-bot { background:#e50914; } .cb-av-user { background:#333; }
      .cb-bubble { padding:9px 13px; border-radius:12px; font-size:.83rem; line-height:1.55; max-width:100%; }
      .cb-msg.bot .cb-bubble { background:#2a2a2a; border-radius:4px 12px 12px 12px; }
      .cb-msg.user .cb-bubble { background:#e50914; border-radius:12px 4px 12px 12px; }
      .cb-typing { display:flex; gap:4px; align-items:center; padding:9px 13px; background:#2a2a2a; border-radius:4px 12px 12px 12px; width:fit-content; }
      .cb-dot { width:7px; height:7px; border-radius:50%; background:#666; }
      .cb-dot:nth-child(1){animation:cbDot 1.2s ease infinite 0s}
      .cb-dot:nth-child(2){animation:cbDot 1.2s ease infinite .2s}
      .cb-dot:nth-child(3){animation:cbDot 1.2s ease infinite .4s}
      @keyframes cbDot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-7px)} }
      .cb-movie-cards { display:flex; gap:9px; overflow-x:auto; padding:4px 0; }
      .cb-movie-cards::-webkit-scrollbar { height:2px; }
      .cb-movie-card { flex-shrink:0; width:108px; background:#333; border-radius:7px; overflow:hidden; cursor:pointer; transition:transform .2s; }
      .cb-movie-card:hover { transform:scale(1.05); }
      .cb-mov-poster { height:76px; display:flex; align-items:center; justify-content:center; font-size:1.9rem; }
      .cb-mov-info { padding:6px 7px; }
      .cb-mov-title { font-size:.7rem; font-weight:600; line-height:1.3; margin-bottom:2px; }
      .cb-mov-rating { font-size:.64rem; color:#e5b80b; }
      .cb-mov-bk { width:100%; background:#e50914; color:#fff; border:none; padding:5px; font-size:.65rem; font-weight:700; cursor:pointer; transition:background .15s; }
      .cb-mov-bk:hover { background:#b81d24; }
      .cb-chips { display:flex; gap:7px; flex-wrap:wrap; padding:6px 0 0; }
      .cb-chip { padding:5px 11px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14); border-radius:20px; font-size:.76rem; cursor:pointer; transition:all .2s; white-space:nowrap; color:#fff; }
      .cb-chip:hover { background:#e50914; border-color:#e50914; }
      .cb-tip { font-size:.7rem; color:#46d369; padding:4px 0; display:flex; align-items:center; gap:4px; }
      .cb-inp-area { padding:11px 13px; border-top:1px solid rgba(255,255,255,.07); display:flex; gap:8px; flex-shrink:0; }
      .cb-inp { flex:1; background:#2a2a2a; border:1px solid rgba(255,255,255,.1); border-radius:20px; padding:8px 13px; color:#fff; font-size:.83rem; font-family:'Exo 2',sans-serif; }
      .cb-inp::placeholder { color:#666; }
      .cb-inp:focus { border-color:rgba(229,9,20,.5); outline:none; }
      .cb-send { width:34px; height:34px; border-radius:50%; background:#e50914; border:none; display:flex; align-items:center; justify-content:center; color:#fff; font-size:.9rem; cursor:pointer; flex-shrink:0; transition:background .15s; }
      .cb-send:hover { background:#b81d24; }
      @media (max-width: 540px) {
        .chatbot-win {
          right: 12px;
          left: 12px;
          width: auto;
          bottom: 88px;
          max-height: 70vh;
        }
        .chatbot-fab { right: 16px; bottom: 16px; }
      }
    `);

    if (!document.getElementById("chatFab")) {
      const fab = document.createElement("button");
      fab.className = "chatbot-fab";
      fab.id = "chatFab";
      fab.type = "button";
      fab.innerHTML = '🤖<div class="cb-unread">1</div>';
      fab.onclick = window.toggleChatbot;
      document.body.appendChild(fab);
    }

    if (!document.getElementById("chatWin")) {
      const win = document.createElement("div");
      win.className = "chatbot-win hidden";
      win.id = "chatWin";
      win.innerHTML = `
        <div class="cb-head">
          <div class="cb-av">🤖</div>
          <div class="cb-head-info">
            <div class="cb-head-title">Movie Assistant</div>
            <div class="cb-head-sub"><span class="cb-online"></span>Online — Ask me what to watch</div>
          </div>
          <button class="cb-close" onclick="toggleChatbot()">✕</button>
        </div>
        <div class="cb-body" id="cbBody">
          <div class="cb-msg bot">
            <div class="cb-av-sm cb-av-bot">🤖</div>
            <div>
              <div class="cb-bubble">
                Hey! I'm your Movie Assistant 🎬<br>I can suggest movies based on your mood, help you find the best shows and deals!
              </div>
              <div class="cb-tip">💡 Morning shows are 30% cheaper!</div>
              <div class="cb-chips">
                <div class="cb-chip" onclick="sendChatMsg('Action movies')">💥 Action</div>
                <div class="cb-chip" onclick="sendChatMsg('Romantic under 2hrs')">❤️ Romantic</div>
                <div class="cb-chip" onclick="sendChatMsg('Family movies')">👨‍👩‍👧 Family</div>
                <div class="cb-chip" onclick="sendChatMsg('Best this weekend')">🎬 Weekend</div>
                <div class="cb-chip" onclick="sendChatMsg('Cheap tickets near me')">💰 Cheap tickets</div>
              </div>
            </div>
          </div>
        </div>
        <div class="cb-inp-area">
          <input class="cb-inp" id="cbInput" placeholder="Ask me anything...">
          <button class="cb-send" onclick="sendChatMsg()">➤</button>
        </div>
      `;
      document.body.appendChild(win);

      const input = document.getElementById("cbInput");
      if (input) {
        input.addEventListener("keydown", function (event) {
          if (event.key === "Enter") window.sendChatMsg();
        });
      }
    }

    safeAPIGet("/movies?limit=30")
      .then(d => {
        if (d && d.success && Array.isArray(d.movies)) chatMovies = d.movies;
      })
      .catch(() => {
        chatMovies = [];
      });
  }

  window.toggleChatbot = function () {
    const win = document.getElementById("chatWin");
    const fab = document.getElementById("chatFab");
    if (!win) return;

    const isOpen = win.classList.contains("visible");
    win.classList.toggle("visible", !isOpen);
    win.classList.toggle("hidden", isOpen);

    const badge = fab?.querySelector(".cb-unread");
    if (badge) badge.remove();
  };

  window.sendChatMsg = function (prefill) {
    const inp = document.getElementById("cbInput");
    const body = document.getElementById("cbBody");
    const rawMsg = prefill || inp?.value?.trim();
    const msg = String(rawMsg || "").trim();

    if (!msg || !body) return;
    if (inp) inp.value = "";

    const userEl = document.createElement("div");
    userEl.className = "cb-msg user";
    userEl.innerHTML = `<div class="cb-av-sm cb-av-user">👤</div><div class="cb-bubble">${escapeHtml(msg)}</div>`;
    body.appendChild(userEl);

    const typing = document.createElement("div");
    typing.className = "cb-msg bot";
    typing.innerHTML = `<div class="cb-av-sm cb-av-bot">🤖</div><div class="cb-typing"><div class="cb-dot"></div><div class="cb-dot"></div><div class="cb-dot"></div></div>`;
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    setTimeout(() => {
      typing.remove();

      const lower = msg.toLowerCase();
      const key = Object.keys(BOT_RESPONSES).find(k => lower.includes(k)) || "default";
      const resp = BOT_RESPONSES[key];

      addBotMessage(body, resp);
      chatMsgCount++;

      if (chatMsgCount % 3 === 0) {
        const tipEl = document.createElement("div");
        tipEl.className = "cb-msg bot";
        tipEl.innerHTML = `<div class="cb-av-sm cb-av-bot">🤖</div><div class="cb-tip">${BOT_TIPS[Math.floor(Math.random() * BOT_TIPS.length)]}</div>`;
        body.appendChild(tipEl);
      }

      body.scrollTop = body.scrollHeight;
    }, 900);
  };

  function addBotMessage(body, resp) {
    const botEl = document.createElement("div");
    botEl.className = "cb-msg bot";

    const filtered = chatMovies
      .filter(m => Array.isArray(m.genre) && m.genre.some(g => String(g).toLowerCase().includes(resp.genre.toLowerCase())))
      .slice(0, 4);

    const movieCards = filtered.length ? `
      <div class="cb-movie-cards">
        ${filtered.map(m => `
          <div class="cb-movie-card" onclick="location.href='movie.html?id=${encodeURIComponent(m._id || "")}'">
            <div class="cb-mov-poster" style="background:${escapeHtml(m.bg || "#1a1a2e")}">${escapeHtml(m.poster || "🎬")}</div>
            <div class="cb-mov-info">
              <div class="cb-mov-title">${escapeHtml((m.title || "").slice(0, 20))}${(m.title || "").length > 20 ? "..." : ""}</div>
              <div class="cb-mov-rating">★ ${escapeHtml(m.rating || "")}</div>
            </div>
            <button class="cb-mov-bk" onclick="event.stopPropagation();location.href='movie.html?id=${encodeURIComponent(m._id || "")}'">Book ›</button>
          </div>
        `).join("")}
      </div>` : "";

    botEl.innerHTML = `
      <div class="cb-av-sm cb-av-bot">🤖</div>
      <div>
        <div class="cb-bubble">${escapeHtml(resp.text)}</div>
        ${movieCards}
      </div>
    `;
    body.appendChild(botEl);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FEATURE 5: CALENDAR BOOKING VIEW
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const CINEMAS_DATA = [
    {
      name: "PVR IMAX Juhu, Mumbai", tags: ["IMAX", "DOLBY", "F&B"], dist: "2.4 km",
      shows: {
        "2D": [{ t: "10:30 AM", s: "", seats: 142 }, { t: "1:45 PM", s: "filling", seats: 43 }, { t: "5:00 PM", s: "almost", seats: 12 }, { t: "8:30 PM", s: "", seats: 156 }, { t: "11:45 PM", s: "", seats: 190 }],
        "IMAX 2D": [{ t: "11:00 AM", s: "", seats: 80 }, { t: "2:30 PM", s: "filling", seats: 22 }, { t: "7:00 PM", s: "almost", seats: 8 }]
      }
    },
    {
      name: "Cinépolis Andheri West", tags: ["RECLINER", "DOLBY"], dist: "4.1 km",
      shows: { "2D": [{ t: "9:00 AM", s: "", seats: 180 }, { t: "12:30 PM", s: "almost", seats: 15 }, { t: "4:15 PM", s: "filling", seats: 38 }, { t: "7:30 PM", s: "", seats: 120 }] }
    },
    {
      name: "HDFC PVR ICON Goregaon", tags: ["PLAYHOUSE", "DOLBY"], dist: "5.2 km",
      shows: { "2D": [{ t: "10:00 AM", s: "", seats: 160 }, { t: "1:30 PM", s: "", seats: 190 }, { t: "4:00 PM", s: "filling", seats: 50 }, { t: "7:30 PM", s: "", seats: 200 }] }
    },
    {
      name: "INOX Nariman Point", tags: ["2D", "4DX"], dist: "8.7 km",
      shows: {
        "2D": [{ t: "11:00 AM", s: "", seats: 200 }, { t: "2:30 PM", s: "", seats: 175 }, { t: "6:00 PM", s: "filling", seats: 44 }, { t: "9:30 PM", s: "almost", seats: 18 }],
        "4DX": [{ t: "1:00 PM", s: "", seats: 60 }, { t: "6:30 PM", s: "filling", seats: 20 }]
      }
    },
    {
      name: "Fun Cinemas Chembur", tags: ["2D"], dist: "6.8 km",
      shows: { "2D": [{ t: "11:30 AM", s: "", seats: 220 }, { t: "3:00 PM", s: "", seats: 180 }, { t: "6:30 PM", s: "", seats: 200 }, { t: "10:00 PM", s: "", seats: 240 }] }
    }
  ];

  let calSelDate = "Today";
  let calSelFmt = "All";

  function renderCalendarBooking(movieId, movieFormats) {
    const section = document.getElementById("calendarBookingSection");
    if (!section) return;

    appendStyleOnce("feature-calendar-style", `
      .cal-bk-wrap { background:#111; border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:18px; margin-bottom:16px; }
      .cal-bk-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
      .cal-bk-title { font-family:'Rajdhani',sans-serif; font-size:1rem; font-weight:700; }
      .cal-date-strip { display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; margin-bottom:14px; }
      .cal-date-strip::-webkit-scrollbar { height:2px; }
      .cal-date-btn { flex-shrink:0; min-width:60px; padding:9px 12px; border-radius:5px; border:1px solid rgba(255,255,255,.1); background:transparent; color:#b3b3b3; font-family:'Exo 2',sans-serif; font-size:.78rem; text-align:center; cursor:pointer; transition:all .2s; }
      .cal-date-btn.on { background:#e50914; border-color:#e50914; color:#fff; }
      .cal-date-btn:hover:not(.on) { border-color:rgba(255,255,255,.25); color:#fff; }
      .cal-d-num { display:block; font-weight:700; font-size:.96rem; }
      .cal-d-day { font-size:.62rem; opacity:.8; }
      .cal-d-today { font-size:.58rem; color:#46d369; font-weight:700; display:block; }
      .cal-fmt-filters { display:flex; gap:7px; margin-bottom:14px; flex-wrap:wrap; }
      .cal-fmt-btn { padding:5px 13px; border-radius:20px; font-size:.76rem; font-weight:600; border:1px solid rgba(255,255,255,.14); background:transparent; color:#b3b3b3; cursor:pointer; transition:all .2s; }
      .cal-fmt-btn.on { background:#e50914; border-color:#e50914; color:#fff; }
      .cal-fmt-btn:hover:not(.on) { border-color:rgba(255,255,255,.25); color:#fff; }
      .cal-legend { display:flex; gap:14px; margin-bottom:12px; font-size:.72rem; color:#808080; flex-wrap:wrap; }
      .cal-cinema-list { display:flex; flex-direction:column; gap:10px; }
      .cal-cinema-card { background:#1a1a1a; border:1px solid rgba(255,255,255,.07); border-radius:7px; padding:13px; transition:border-color .2s; }
      .cal-cinema-card:hover { border-color:rgba(255,255,255,.14); }
      .cal-cinema-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:9px; }
      .cal-cinema-name { font-weight:700; font-size:.9rem; margin-bottom:3px; }
      .cal-cinema-tags { display:flex; gap:5px; flex-wrap:wrap; }
      .cal-tag { font-size:.6rem; padding:1px 7px; border-radius:2px; background:rgba(255,255,255,.06); color:#808080; }
      .cal-cinema-dist { font-size:.72rem; color:#808080; }
      .cal-show-slots { display:flex; gap:8px; flex-wrap:wrap; }
      .cal-slot { padding:7px 14px; border:1px solid rgba(255,255,255,.14); border-radius:5px; font-size:.84rem; font-weight:700; color:#fff; cursor:pointer; font-family:'Rajdhani',sans-serif; transition:all .2s; text-align:center; min-width:78px; position:relative; }
      .cal-slot:hover { border-color:#e50914; color:#e50914; background:rgba(229,9,20,.06); }
      .cal-slot.filling { border-color:rgba(255,165,0,.5); color:#ffa500; }
      .cal-slot.almost { border-color:rgba(229,9,20,.5); color:#e50914; }
      .cal-slot-status { display:block; font-size:.58rem; font-family:'Exo 2',sans-serif; font-weight:400; margin-top:1px; color:#46d369; }
      .cal-slot.filling .cal-slot-status { color:#ffa500; }
      .cal-slot.almost .cal-slot-status { color:#e50914; }
      .cal-slot-seats { display:block; font-size:.58rem; font-family:'Exo 2',sans-serif; font-weight:400; color:#808080; margin-top:1px; }
    `);

    const formats = ["All", ...(movieFormats || ["2D", "IMAX 2D", "DOLBY", "4DX"])];

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    let dateButtons = "";

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${days[d.getDay()]} ${d.getDate()}`;
      dateButtons += `
        <button class="cal-date-btn ${i === 0 ? "on" : ""}" onclick="calSelectDate(this,'${label}')">
          <span class="cal-d-num">${d.getDate()}</span>
          <span class="cal-d-day">${days[d.getDay()]}, ${months[d.getMonth()]}</span>
          ${i === 0 ? '<span class="cal-d-today">Today</span>' : ""}
        </button>`;
    }

    section.innerHTML = `
      <div class="cal-bk-wrap">
        <div class="cal-bk-header">
          <div class="cal-bk-title">📅 Select Date & Show</div>
          <div style="font-size:.74rem;color:#808080">7 days available</div>
        </div>
        <div class="cal-date-strip">${dateButtons}</div>
        <div class="cal-fmt-filters">
          ${formats.map((f, i) => `<button class="cal-fmt-btn ${i === 0 ? "on" : ""}" onclick="calSelectFmt(this,'${escapeHtml(f)}')">${escapeHtml(f)}</button>`).join("")}
        </div>
        <div class="cal-legend">
          <span><span style="color:#46d369">●</span> Available</span>
          <span><span style="color:#ffa500">●</span> Filling Fast</span>
          <span><span style="color:#e50914">●</span> Almost Full</span>
        </div>
        <div class="cal-cinema-list" id="calCinemaList"></div>
      </div>
    `;

    renderCalCinemas(movieId);
  }

  window.calSelectDate = function (btn, date) {
    qsa(".cal-date-btn").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    calSelDate = date;
    const id = new URLSearchParams(location.search).get("id");
    renderCalCinemas(id);
  };

  window.calSelectFmt = function (btn, fmt) {
    qsa(".cal-fmt-btn").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    calSelFmt = fmt;
    const id = new URLSearchParams(location.search).get("id");
    renderCalCinemas(id);
  };

  function renderCalCinemas(movieId) {
    const list = document.getElementById("calCinemaList");
    if (!list) return;

    const cinemas = CINEMAS_DATA.filter(c => {
      if (calSelFmt === "All") return true;
      return Object.keys(c.shows).some(fmt => fmt.toLowerCase().includes(calSelFmt.toLowerCase()) || calSelFmt.toLowerCase().includes(fmt.split(" ")[0].toLowerCase()));
    });

    if (!cinemas.length) {
      list.innerHTML = `<div style="text-align:center;padding:30px;color:#808080">No shows available for selected format</div>`;
      return;
    }

    list.innerHTML = cinemas.map(c => {
      const fmts = calSelFmt === "All"
        ? Object.keys(c.shows)
        : Object.keys(c.shows).filter(f => f.toLowerCase().includes(calSelFmt.toLowerCase()) || calSelFmt === "All");

      const selectedFmt = fmts[0] || "2D";
      const slots = (c.shows[selectedFmt] || []).map(s => `
        <div class="cal-slot ${s.s}" onclick="handleCalBooking('${encodeURIComponent(movieId || "")}','${encodeURIComponent(c.name)}','${s.t}','${calSelDate}','${selectedFmt}')">
          ${s.t}
          <span class="cal-slot-status">${s.s === "almost" ? "Almost Full" : s.s === "filling" ? "Filling Fast" : "Available"}</span>
          <span class="cal-slot-seats">${s.seats} seats</span>
        </div>`).join("");

      return `
        <div class="cal-cinema-card">
          <div class="cal-cinema-head">
            <div>
              <div class="cal-cinema-name">${escapeHtml(c.name)}</div>
              <div class="cal-cinema-tags">${c.tags.map(t => `<span class="cal-tag">${escapeHtml(t)}</span>`).join("")}</div>
            </div>
            <div class="cal-cinema-dist">📍 ${escapeHtml(c.dist)}</div>
          </div>
          <div class="cal-show-slots">${slots}</div>
        </div>`;
    }).join("");
  }

  window.handleCalBooking = function (movieId, cinema, time, date, format) {
    if (!isLoggedInSafe()) {
      safeToast("Please login to book tickets", "warn");
      setTimeout(() => {
        location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
      }, 800);
      return;
    }

    if (typeof window.showSeatCountPopup === "function") {
      window.showSeatCountPopup(
        decodeURIComponent(movieId || ""),
        decodeURIComponent(cinema || ""),
        time,
        date,
        format
      );
      return;
    }

    safeToast(`Selected ${decodeURIComponent(cinema)} • ${time} • ${date} • ${format}`, "success");
  };

  window.renderCalendarBooking = renderCalendarBooking;

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     MASTER INIT
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function masterInit() {
    initVoiceSearch();
    initChatbot();
    initFoodPreOrder();
    initRewardsSystem();
    setTimeout(injectMicToNavbar, 300);
  }

  document.addEventListener("DOMContentLoaded", masterInit);

  const _origMount = window.mountNavbar;
  if (typeof _origMount === "function" && !_origMount.__featuresWrapped) {
    const wrapped = function (...args) {
      _origMount.apply(this, args);
      setTimeout(injectMicToNavbar, 100);
    };
    wrapped.__featuresWrapped = true;
    window.mountNavbar = wrapped;
  }

  // expose useful render helpers
  window.renderFoodSection = renderFoodSection;
})();