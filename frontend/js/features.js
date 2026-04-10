// ============================================================
// features.js — FULLY FIXED & UPGRADED (ALL 5 FEATURES)
// 1. Food Pre-Order  2. Voice Search  3. Rewards  4. Chatbot (AI-powered)  5. Calendar
// ============================================================

(function () {
  "use strict";

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SAFE HELPERS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function safeToast(msg, type, ms) {
    type = type || "info";
    ms = ms || 2600;
    if (typeof window.TOAST !== "undefined" && window.TOAST && typeof window.TOAST.show === "function") {
      window.TOAST.show(msg, type, ms);
    } else {
      var styles = { info: "color:#4fc3f7", success: "color:#66bb6a", warn: "color:#ffa726", error: "color:#ef5350" };
      console.log("%c[" + type.toUpperCase() + "] " + msg, styles[type] || "");
    }
  }

  function isLoggedInSafe() {
    try {
      if (typeof window.SESSION !== "undefined" && window.SESSION && typeof window.SESSION.isLoggedIn === "function") {
        return window.SESSION.isLoggedIn();
      }
    } catch (e) {}
    return !!localStorage.getItem("mz_token");
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
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
    var style = document.createElement("style");
    style.id = id;
    style.textContent = cssText;
    document.head.appendChild(style);
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FEATURE 1: FOOD PRE-ORDER SYSTEM
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  var FOOD_ITEMS = [
    { id: "pc", name: "Popcorn Combo", desc: "Large popcorn + Coke 500ml", price: 249, emoji: "\uD83C\uDF7F", popular: true },
    { id: "nc", name: "Nachos + Coke", desc: "Nachos with cheese dip + Coke", price: 199, emoji: "\uD83E\uDDC2", popular: false },
    { id: "bc", name: "Burger Combo", desc: "Veg burger + fries + Pepsi", price: 299, emoji: "\uD83C\uDF54", popular: false },
    { id: "cf", name: "Cafe Latte", desc: "Hot coffee, freshly brewed", price: 149, emoji: "\u2615", popular: false },
    { id: "ic", name: "Ice Cream", desc: "2 scoops chocolate/vanilla", price: 129, emoji: "\uD83C\uDF66", popular: false },
    { id: "sp", name: "Spring Rolls", desc: "Crispy spring rolls x6", price: 179, emoji: "\uD83E\uDD5F", popular: false }
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

    appendStyleOnce("feature-food-style", [
      ".food-po-section{background:#0d1117;border:1px solid rgba(229,9,20,.2);border-radius:10px;padding:20px;margin-top:20px}",
      ".food-po-title{font-family:'Rajdhani',sans-serif;font-size:1.1rem;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px}",
      ".food-po-sub{font-size:.78rem;color:#888;margin-bottom:16px}",
      ".food-cards-wrap{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:16px}",
      ".food-card-item{background:#161b22;border:1px solid rgba(255,255,255,.07);border-radius:8px;overflow:hidden;transition:transform .25s,border-color .25s,box-shadow .25s;cursor:default;position:relative}",
      ".food-card-item:hover{transform:translateY(-5px);border-color:rgba(229,9,20,.4);box-shadow:0 10px 30px rgba(0,0,0,.6)}",
      ".food-card-img{height:90px;display:flex;align-items:center;justify-content:center;font-size:2.8rem;background:linear-gradient(135deg,#1a1a2e,#16213e);position:relative}",
      ".food-popular-tag{position:absolute;top:6px;left:6px;background:#e50914;color:#fff;font-size:.58rem;font-weight:700;padding:2px 6px;border-radius:3px;letter-spacing:.4px}",
      ".food-card-body{padding:10px}",
      ".food-card-name{font-size:.82rem;font-weight:700;margin-bottom:2px;color:#fff}",
      ".food-card-desc{font-size:.68rem;color:#888;margin-bottom:7px;line-height:1.4}",
      ".food-card-price{font-family:'Rajdhani',sans-serif;font-size:1rem;font-weight:700;color:#e5b80b;margin-bottom:8px}",
      ".food-card-actions{display:flex;align-items:center;justify-content:space-between;gap:6px}",
      ".food-qty-wrap{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border-radius:4px;padding:3px 7px}",
      ".food-qty-btn{width:22px;height:22px;border-radius:3px;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:.9rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;line-height:1}",
      ".food-qty-btn:hover{background:#e50914}",
      ".food-qty-num{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.95rem;min-width:16px;text-align:center;color:#fff}",
      ".food-add-btn{background:#e50914;color:#fff;border:none;padding:5px 12px;border-radius:4px;font-size:.74rem;font-weight:700;cursor:pointer;transition:background .15s;white-space:nowrap}",
      ".food-add-btn:hover{background:#b81d24}",
      ".food-add-btn.added{background:#46d369;color:#000}"
    ].join(""));
  }

  function renderFoodSection(container) {
    if (!container || document.getElementById("foodPreOrderSection")) return;

    var sec = document.createElement("div");
    sec.id = "foodPreOrderSection";
    sec.className = "food-po-section";

    var gridHtml = "";
    for (var i = 0; i < FOOD_ITEMS.length; i++) {
      var item = FOOD_ITEMS[i];
      gridHtml += [
        '<div class="food-card-item">',
          '<div class="food-card-img">',
            item.popular ? '<div class="food-popular-tag">&#9733; POPULAR</div>' : "",
            item.emoji,
          '</div>',
          '<div class="food-card-body">',
            '<div class="food-card-name">' + escapeHtml(item.name) + '</div>',
            '<div class="food-card-desc">' + escapeHtml(item.desc) + '</div>',
            '<div class="food-card-price">&#8377;' + item.price + '</div>',
            '<div class="food-card-actions">',
              '<div class="food-qty-wrap">',
                '<button class="food-qty-btn" onclick="changeFoodQty(\'' + item.id + '\',-1)">&#8722;</button>',
                '<span class="food-qty-num" id="fq_' + item.id + '">0</span>',
                '<button class="food-qty-btn" onclick="changeFoodQty(\'' + item.id + '\',1)">+</button>',
              '</div>',
              '<button class="food-add-btn" id="fadd_' + item.id + '" onclick="addFoodItem(\'' + item.id + '\')">Add</button>',
            '</div>',
          '</div>',
        '</div>'
      ].join("");
    }

    sec.innerHTML = [
      '<div class="food-po-title">&#127871; Add Food &amp; Beverages</div>',
      '<div class="food-po-sub">Skip the queue &mdash; order food with your ticket!</div>',
      '<div class="food-cards-wrap" id="foodCardsGrid">' + gridHtml + '</div>',
      '<div id="foodCartSummary" style="display:none;background:#161b22;border:1px solid rgba(229,9,20,.2);border-radius:6px;padding:12px;margin-top:8px;">',
        '<div style="font-size:.84rem;font-weight:700;margin-bottom:8px;color:#fff;">&#128722; Your Food Order</div>',
        '<div id="foodCartItems"></div>',
        '<div style="border-top:1px solid rgba(255,255,255,.07);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-weight:700;">',
          '<span style="color:#888;">Food Total</span>',
          '<span style="color:#e5b80b;" id="foodTotalDisplay">&#8377;0</span>',
        '</div>',
      '</div>'
    ].join("");

    container.appendChild(sec);
    updateFoodSummary();
  }

  window.changeFoodQty = function (id, delta) {
    var cart = getActiveFoodCart();
    var curr = cart[id] || 0;
    var next = Math.max(0, curr + delta);

    if (next === 0) {
      delete cart[id];
    } else {
      cart[id] = next;
    }

    var el = document.getElementById("fq_" + id);
    if (el) el.textContent = next;

    var addBtn = document.getElementById("fadd_" + id);
    if (addBtn) {
      addBtn.textContent = next > 0 ? "Added (" + next + ")" : "Add";
      if (next > 0) addBtn.classList.add("added");
      else addBtn.classList.remove("added");
    }

    updateFoodSummary();

    try {
      if (typeof window.updateFoodCartSummary === "function") window.updateFoodCartSummary();
    } catch (e) {}

    updateBookingTotal();

    try {
      if (typeof window.updatePanel === "function") window.updatePanel();
    } catch (e) {}
  };

  window.addFoodItem = function (id) {
    window.changeFoodQty(id, 1);
  };

  function updateFoodSummary() {
    var summaryEl = document.getElementById("foodCartSummary");
    var itemsEl = document.getElementById("foodCartItems");
    var totalEl = document.getElementById("foodTotalDisplay");
    if (!summaryEl) return;

    var total = 0;
    var cart = getActiveFoodCart();
    var entries = Object.keys(cart).filter(function (k) { return cart[k] > 0; });

    if (!entries.length) {
      summaryEl.style.display = "none";
      if (totalEl) totalEl.innerHTML = "&#8377;0";
      if (itemsEl) itemsEl.innerHTML = "";
      return;
    }

    summaryEl.style.display = "block";

    if (itemsEl) {
      var html = "";
      for (var i = 0; i < entries.length; i++) {
        var k = entries[i];
        var qty = cart[k];
        var item = null;
        for (var j = 0; j < FOOD_ITEMS.length; j++) {
          if (FOOD_ITEMS[j].id === k) { item = FOOD_ITEMS[j]; break; }
        }
        if (!item) continue;
        total += item.price * qty;
        html += '<div style="display:flex;justify-content:space-between;font-size:.8rem;padding:3px 0;color:#b3b3b3">' +
          '<span>' + item.emoji + " " + escapeHtml(item.name) + " x" + qty + '</span>' +
          '<span>&#8377;' + (item.price * qty) + '</span></div>';
      }
      itemsEl.innerHTML = html;
    }

    if (totalEl) totalEl.innerHTML = "&#8377;" + total;
  }

  function getFoodTotal() {
    var cart = getActiveFoodCart();
    var total = 0;
    var keys = Object.keys(cart);
    for (var i = 0; i < keys.length; i++) {
      var id = keys[i];
      var qty = cart[id];
      for (var j = 0; j < FOOD_ITEMS.length; j++) {
        if (FOOD_ITEMS[j].id === id) { total += FOOD_ITEMS[j].price * qty; break; }
      }
    }
    return total;
  }

  function updateBookingTotal() {
    var foodRowEl = document.getElementById("panelFood");
    var grandEl = document.getElementById("panelGrand");
    var baseEl = document.getElementById("panelBase");
    var convEl = document.getElementById("panelConv");
    if (!grandEl) return;

    var base = parseInt(String((baseEl && baseEl.textContent) || "0").replace(/[^\d]/g, ""), 10) || 0;
    var conv = parseInt(String((convEl && convEl.textContent) || "0").replace(/[^\d]/g, ""), 10) || 0;
    var food = getFoodTotal();

    if (foodRowEl) foodRowEl.innerHTML = "&#8377;" + food;
    grandEl.innerHTML = "&#8377;" + (base + conv + food);
  }

  window.renderFoodSection = renderFoodSection;

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FEATURE 2: VOICE SEARCH
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function initVoiceSearch() {
    appendStyleOnce("feature-voice-style", [
      ".voice-modal-overlay{display:none;position:fixed;inset:0;z-index:5000;background:rgba(0,0,0,.92);backdrop-filter:blur(20px);align-items:center;justify-content:center;flex-direction:column}",
      ".voice-modal-overlay.open{display:flex;animation:vsIn .3s ease}",
      "@keyframes vsIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}",
      ".voice-modal{text-align:center;padding:44px 36px;background:#1a1a1a;border-radius:16px;border:1px solid rgba(229,9,20,.3);max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.8)}",
      ".v-mic-ring{width:110px;height:110px;border-radius:50%;background:#e50914;margin:0 auto 22px;display:flex;align-items:center;justify-content:center;font-size:2.6rem;cursor:pointer;transition:all .2s;box-shadow:0 0 0 0 rgba(229,9,20,.4);border:none;color:#fff}",
      ".v-mic-ring.listening{animation:mPulse 1.2s infinite;box-shadow:0 0 0 12px rgba(229,9,20,.15)}",
      "@keyframes mPulse{0%,100%{box-shadow:0 0 0 0 rgba(229,9,20,.4)}70%{box-shadow:0 0 0 22px rgba(229,9,20,0)}}",
      ".v-status{font-family:'Rajdhani',sans-serif;font-size:1.45rem;font-weight:700;margin-bottom:6px;color:#fff}",
      ".v-hint{font-size:.84rem;color:#888;margin-bottom:20px;line-height:1.6}",
      ".sound-wave{display:flex;align-items:center;justify-content:center;gap:5px;height:44px;margin-bottom:18px}",
      ".wave-bar{width:5px;border-radius:3px;background:#e50914;height:6px}",
      ".wave-bar:nth-child(1){animation:wvB .7s ease-in-out infinite 0s}",
      ".wave-bar:nth-child(2){animation:wvB .7s ease-in-out infinite .1s}",
      ".wave-bar:nth-child(3){animation:wvB .7s ease-in-out infinite .2s}",
      ".wave-bar:nth-child(4){animation:wvB .7s ease-in-out infinite .1s}",
      ".wave-bar:nth-child(5){animation:wvB .7s ease-in-out infinite 0s}",
      "@keyframes wvB{0%,100%{height:6px}50%{height:32px}}",
      ".v-suggestions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px}",
      ".v-chip{padding:6px 14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:20px;font-size:.78rem;cursor:pointer;transition:all .2s;color:#fff}",
      ".v-chip:hover{background:#e50914;border-color:#e50914}",
      ".v-close{margin-top:18px;font-size:.82rem;cursor:pointer;border:none;background:none;color:#888}",
      ".v-close:hover{color:#fff}",
      ".nav-mic-btn{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:#e50914;display:flex;align-items:center;justify-content:center;font-size:.88rem;cursor:pointer;border:none;color:#fff;transition:all .2s}",
      ".nav-mic-btn:hover{background:#b81d24;transform:translateY(-50%) scale(1.08)}",
      ".nav-mic-btn.active{animation:mPulse 1s infinite}",
      ".nav-search-inp.listening{border-color:#e50914!important;box-shadow:0 0 0 2px rgba(229,9,20,.3)!important}"
    ].join(""));

    if (document.getElementById("voiceModal")) return;

    var modal = document.createElement("div");
    modal.className = "voice-modal-overlay";
    modal.id = "voiceModal";
    modal.innerHTML = [
      '<div class="voice-modal">',
        '<button class="v-mic-ring" id="vMicCircle">&#127908;</button>',
        '<div class="v-status" id="vStatus">Speak Now</div>',
        '<div class="v-hint" id="vHint">Try saying: "Show action movies in Mumbai"</div>',
        '<div class="sound-wave" id="soundWave" style="display:none">',
          '<div class="wave-bar"></div><div class="wave-bar"></div>',
          '<div class="wave-bar"></div><div class="wave-bar"></div>',
          '<div class="wave-bar"></div>',
        '</div>',
        '<div class="v-suggestions">',
          '<div class="v-chip" onclick="voiceSearch(\'Action movies\')">Action</div>',
          '<div class="v-chip" onclick="voiceSearch(\'Horror movies\')">Horror</div>',
          '<div class="v-chip" onclick="voiceSearch(\'Comedy movies\')">Comedy</div>',
          '<div class="v-chip" onclick="voiceSearch(\'Thriller movies\')">Thriller</div>',
          '<div class="v-chip" onclick="voiceSearch(\'Sci-Fi movies\')">Sci-Fi</div>',
        '</div>',
        '<button class="v-close" onclick="closeVoiceModal()">&#x2715; Close</button>',
      '</div>'
    ].join("");
    document.body.appendChild(modal);

    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeVoiceModal();
    });

    var micCircle = document.getElementById("vMicCircle");
    if (micCircle) micCircle.addEventListener("click", startListening);
  }

  function injectMicToNavbar() {
    var wrap = document.querySelector(".nav-search-wrap");
    var inp = document.querySelector(".nav-search-inp");
    if (!wrap || !inp || document.querySelector(".nav-mic-btn")) return;

    inp.style.paddingRight = "42px";

    var mic = document.createElement("button");
    mic.className = "nav-mic-btn";
    mic.id = "navMicBtn";
    mic.innerHTML = "&#127908;";
    mic.title = "Voice Search";
    mic.type = "button";
    mic.onclick = openVoiceModal;
    wrap.appendChild(mic);
  }

  function openVoiceModal() {
    var modal = document.getElementById("voiceModal");
    if (!modal) return;
    modal.classList.add("open");
    startListening();
  }

  function closeVoiceModal() {
    var modal = document.getElementById("voiceModal");
    if (modal) modal.classList.remove("open");
    stopListening();
  }

  var recognition = null;

  function startListening() {
    var micBtn = document.getElementById("navMicBtn");
    var micCircle = document.getElementById("vMicCircle");
    var inp = document.querySelector(".nav-search-inp");
    var wave = document.getElementById("soundWave");
    var statusEl = document.getElementById("vStatus");
    var hintEl = document.getElementById("vHint");

    if (micBtn) micBtn.classList.add("active");
    if (micCircle) micCircle.classList.add("listening");
    if (inp) inp.classList.add("listening");
    if (wave) wave.style.display = "flex";
    if (statusEl) statusEl.textContent = "Listening...";
    if (hintEl) hintEl.textContent = "Speak clearly near the microphone";

    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      try {
        if (recognition) recognition.stop();
      } catch (e) {}

      recognition = new SR();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = function (e) {
        var text = (e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript) || "";
        if (inp) inp.value = text;
        window.voiceSearch(text);
      };
      recognition.onerror = function () {
        if (statusEl) statusEl.textContent = "Could not hear. Try again!";
        setTimeout(stopListening, 1500);
      };
      recognition.onend = function () { stopListening(); };

      try { recognition.start(); } catch (e) {}
    } else {
      if (statusEl) statusEl.textContent = "Tap a suggestion below!";
    }
  }

  function stopListening() {
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
      recognition = null;
    }
    var micBtn = document.getElementById("navMicBtn");
    var micCircle = document.getElementById("vMicCircle");
    var inp = document.querySelector(".nav-search-inp");
    var wave = document.getElementById("soundWave");
    var statusEl = document.getElementById("vStatus");
    var hintEl = document.getElementById("vHint");

    if (micBtn) micBtn.classList.remove("active");
    if (micCircle) micCircle.classList.remove("listening");
    if (inp) inp.classList.remove("listening");
    if (wave) wave.style.display = "none";
    if (statusEl) statusEl.textContent = "Speak Now";
    if (hintEl) hintEl.textContent = 'Try saying: "Show action movies in Mumbai"';
  }

  window.voiceSearch = function (query) {
    var inp = document.querySelector(".nav-search-inp");
    if (inp) inp.value = query || "";
    closeVoiceModal();
    safeToast('Searching: "' + query + '"', "info");
    setTimeout(function () {
      location.href = "search.html?q=" + encodeURIComponent(query || "");
    }, 400);
  };

  window.closeVoiceModal = closeVoiceModal;
  window.openVoiceModal = openVoiceModal;

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FEATURE 3: REWARD POINTS SYSTEM
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function initRewardsSystem() {
    appendStyleOnce("feature-rewards-style", [
      ".rw-wallet{background:linear-gradient(135deg,#0d1117 0%,#1a2035 50%,#0f1923 100%);border:1px solid rgba(229,184,11,.28);border-radius:12px;padding:22px;margin-bottom:18px;position:relative;overflow:hidden}",
      ".rw-wallet.gold-tier{border-color:rgba(229,184,11,.5);background:linear-gradient(135deg,#1a1000,#2a1c00,#1a1000)}",
      ".rw-wallet.platinum-tier{border-color:rgba(185,242,255,.4);background:linear-gradient(135deg,#0a101a,#111b2e,#0a1018)}",
      ".rw-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}",
      ".rw-pts-label{font-size:.74rem;color:#808080;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}",
      ".rw-pts-value{font-family:'Bebas Neue','Rajdhani',sans-serif;font-size:2.8rem;color:#e5b80b;letter-spacing:2px;line-height:1}",
      ".rw-pts-sub{font-size:.72rem;color:#808080;margin-top:2px}",
      ".rw-badge{padding:5px 14px;border-radius:20px;font-size:.74rem;font-weight:700;display:inline-flex;align-items:center;gap:5px}",
      ".rw-badge.silver{background:rgba(192,192,192,.14);border:1px solid rgba(192,192,192,.4);color:#c0c0c0}",
      ".rw-badge.gold{background:rgba(229,184,11,.14);border:1px solid rgba(229,184,11,.4);color:#e5b80b}",
      ".rw-badge.platinum{background:rgba(185,242,255,.1);border:1px solid rgba(185,242,255,.36);color:#b9f2ff}",
      ".rw-prog-section{margin-bottom:18px}",
      ".rw-prog-label{display:flex;justify-content:space-between;font-size:.76rem;color:#808080;margin-bottom:7px}",
      ".rw-prog-bar{height:7px;background:rgba(255,255,255,.1);border-radius:4px;overflow:hidden}",
      ".rw-prog-fill{height:100%;background:linear-gradient(90deg,#e5b80b,#ff8c00);border-radius:4px;width:0;transition:width 1.2s ease}",
      ".rw-breakdown{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px}",
      ".rw-br-item{background:rgba(255,255,255,.05);border-radius:6px;padding:10px;text-align:center}",
      ".rw-br-num{font-family:'Rajdhani',sans-serif;font-size:1.1rem;font-weight:700;color:#e5b80b}",
      ".rw-br-lbl{font-size:.62rem;color:#808080;margin-top:2px;line-height:1.4}",
      ".rw-actions{display:flex;gap:9px;margin-bottom:18px;flex-wrap:wrap}",
      ".rw-coupons-title{font-size:.76rem;color:#808080;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px}",
      ".rw-coupon-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}",
      ".rw-coupon-item{background:rgba(255,255,255,.03);border:1px dashed rgba(255,255,255,.12);border-radius:8px;padding:11px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:9px}",
      ".rw-coupon-item:hover{background:rgba(229,9,20,.08);border-color:rgba(229,9,20,.4)}",
      ".rw-coupon-ico{font-size:1.5rem;flex-shrink:0}",
      ".rw-coupon-pts{font-size:.68rem;color:#e5b80b;font-weight:700;margin-bottom:1px}",
      ".rw-coupon-name{font-size:.78rem;font-weight:600;color:#fff}"
    ].join(""));
  }

  function renderRewardsCard(container, points) {
    if (!container) return;
    points = points || 0;

    var tier = points >= 1000 ? "platinum" : points >= 500 ? "gold" : "silver";
    var tierLabel = tier === "platinum" ? "&#x1F4CE; Platinum" : tier === "gold" ? "&#x1F947; Gold" : "&#x1F948; Silver";
    var nextTier = tier === "silver"
      ? { name: "Gold", target: 500 }
      : { name: "Platinum", target: 1000 };
    var progress = Math.min(100, Math.round((points / nextTier.target) * 100));

    var bkPts = Math.floor(points * 0.7);
    var foodPts = Math.floor(points * 0.2);
    var bonusPts = points - bkPts - foodPts;

    var coupons = [
      { ico: "&#x1F3DF;", pts: "100 pts", name: "&#8377;50 Off Ticket", need: 100 },
      { ico: "&#x1F37F;", pts: "250 pts", name: "Free Popcorn", need: 250 },
      { ico: "&#x1F4B0;", pts: "500 pts", name: "&#8377;200 Off", need: 500 },
      { ico: "&#x2B06;&#xFE0F;", pts: "750 pts", name: "Seat Upgrade", need: 750 }
    ];

    var couponHtml = "";
    for (var c = 0; c < coupons.length; c++) {
      var cp = coupons[c];
      couponHtml += [
        '<div class="rw-coupon-item" onclick="redeemCoupon(\'' + cp.name.replace(/'/g, "") + '\',' + cp.need + ',' + points + ')">',
          '<div class="rw-coupon-ico">' + cp.ico + '</div>',
          '<div><div class="rw-coupon-pts">' + cp.pts + '</div><div class="rw-coupon-name">' + cp.name + '</div></div>',
        '</div>'
      ].join("");
    }

    container.innerHTML = [
      '<div class="rw-wallet ' + tier + '-tier">',
        '<div class="rw-top">',
          '<div>',
            '<div class="rw-pts-label">My Rewards</div>',
            '<div class="rw-pts-value" id="rwPtsCounter">0</div>',
            '<div class="rw-pts-sub">Points</div>',
          '</div>',
          '<div class="rw-badge ' + tier + '">' + tierLabel + '</div>',
        '</div>',
        '<div class="rw-prog-section">',
          '<div class="rw-prog-label">',
            '<span>' + points + ' / ' + nextTier.target + ' pts to ' + nextTier.name + '</span>',
            '<span>' + progress + '%</span>',
          '</div>',
          '<div class="rw-prog-bar"><div class="rw-prog-fill" id="rwProgFill"></div></div>',
        '</div>',
        '<div class="rw-breakdown">',
          '<div class="rw-br-item"><div class="rw-br-num">+' + bkPts + '</div><div class="rw-br-lbl">From Bookings</div></div>',
          '<div class="rw-br-item"><div class="rw-br-num">+' + foodPts + '</div><div class="rw-br-lbl">Food Orders</div></div>',
          '<div class="rw-br-item"><div class="rw-br-num">+' + bonusPts + '</div><div class="rw-br-lbl">Bonus</div></div>',
        '</div>',
        '<div class="rw-actions">',
          '<button class="btn btn-red btn-sm" onclick="safeToast && safeToast(\'Reward redemption coming soon!\',\'info\')">&#127873; Redeem Now</button>',
          '<button class="btn btn-glass btn-sm" onclick="safeToast && safeToast(\'Points history coming soon!\',\'info\')">&#x1F4CB; View History</button>',
        '</div>',
        '<div class="rw-coupons-title">&#x1F3AB; Redeem Coupons</div>',
        '<div class="rw-coupon-grid">' + couponHtml + '</div>',
      '</div>'
    ].join("");

    var counterEl = container.querySelector("#rwPtsCounter");
    if (counterEl) {
      var current = 0;
      var step = Math.max(1, Math.ceil(points / 40));
      var timer = setInterval(function () {
        current = Math.min(current + step, points);
        counterEl.textContent = current.toLocaleString("en-IN");
        if (current >= points) clearInterval(timer);
      }, 30);
    }

    setTimeout(function () {
      var fill = container.querySelector("#rwProgFill");
      if (fill) fill.style.width = progress + "%";
    }, 300);
  }

  window.redeemCoupon = function (name, needed, userPts) {
    needed = parseInt(needed, 10) || 0;
    if (userPts < needed) {
      safeToast("You need " + needed + " pts for this reward. You have " + userPts + " pts.", "warn");
    } else {
      safeToast('&#x2705; "' + name + '" redeemed! Coupon sent to your email.', "success");
    }
  };

  window.renderRewardsCard = renderRewardsCard;

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FEATURE 4: AI CHATBOT — ANTHROPIC API POWERED
     Real movie suggestions with posters via Claude
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  // Fallback movie data when API unavailable
  var FALLBACK_MOVIES = {
    action: [
      { id: "m1", title: "Kalki 2898-AD", rating: "8.5", year: "2024", lang: "Hindi", genre: "Action/Sci-Fi", bg: "#1a0a00", emoji: "&#x1F9D9;", poster: "https://image.tmdb.org/t/p/w200/1kuALhYkMJxMi7KDcT55WKrVKVe.jpg" },
      { id: "m2", title: "Fighter", rating: "7.2", year: "2024", lang: "Hindi", genre: "Action", bg: "#00101a", emoji: "&#x1F6A9;", poster: "https://image.tmdb.org/t/p/w200/yRt7MGBElkLqOzIHqeiAgUrV3cQ.jpg" },
      { id: "m3", title: "Pushpa 2", rating: "8.0", year: "2024", lang: "Hindi", genre: "Action/Drama", bg: "#0a1500", emoji: "&#x1F525;", poster: "https://image.tmdb.org/t/p/w200/oc3TBhOrp5eoO7yhyM2TdC2fVnP.jpg" },
      { id: "m4", title: "Animal", rating: "7.6", year: "2023", lang: "Hindi", genre: "Action/Crime", bg: "#1a0000", emoji: "&#x1F98A;", poster: "" }
    ],
    thriller: [
      { id: "m5", title: "Tumbbad", rating: "8.2", year: "Rerelease", lang: "Hindi", genre: "Thriller/Horror", bg: "#0d0005", emoji: "&#x1F3DB;", poster: "" },
      { id: "m6", title: "Article 370", rating: "8.1", year: "2024", lang: "Hindi", genre: "Political Thriller", bg: "#000d1a", emoji: "&#x1F4DC;", poster: "" },
      { id: "m7", title: "Merry Christmas", rating: "7.5", year: "2024", lang: "Hindi", genre: "Thriller", bg: "#0a000d", emoji: "&#x1F384;", poster: "" }
    ],
    comedy: [
      { id: "m8", title: "Crew", rating: "7.1", year: "2024", lang: "Hindi", genre: "Comedy/Crime", bg: "#00001a", emoji: "&#x1F91F;", poster: "" },
      { id: "m9", title: "Maidaan", rating: "7.8", year: "2024", lang: "Hindi", genre: "Sports/Drama", bg: "#001a00", emoji: "&#x26BD;", poster: "" }
    ],
    romance: [
      { id: "m10", title: "Ae Watan Mere Watan", rating: "7.3", year: "2024", lang: "Hindi", genre: "Romance/Drama", bg: "#1a0010", emoji: "&#x1F496;", poster: "" },
      { id: "m11", title: "Teri Baaton Mein", rating: "6.8", year: "2024", lang: "Hindi", genre: "Romance", bg: "#1a0a00", emoji: "&#x1F916;", poster: "" }
    ],
    horror: [
      { id: "m12", title: "Stree 2", rating: "8.4", year: "2024", lang: "Hindi", genre: "Horror/Comedy", bg: "#0a000a", emoji: "&#x1F47B;", poster: "" },
      { id: "m13", title: "Munjya", rating: "7.5", year: "2024", lang: "Hindi", genre: "Horror/Comedy", bg: "#000a00", emoji: "&#x1F9DF;", poster: "" }
    ],
    scifi: [
      { id: "m14", title: "Kalki 2898-AD", rating: "8.5", year: "2024", lang: "Hindi", genre: "Sci-Fi/Action", bg: "#1a0a00", emoji: "&#x1F680;", poster: "" },
      { id: "m15", title: "Dune Part Two", rating: "8.6", year: "2024", lang: "English", genre: "Sci-Fi/Epic", bg: "#0a0800", emoji: "&#x1F3DC;", poster: "" }
    ],
    default: [
      { id: "m1", title: "Kalki 2898-AD", rating: "8.5", year: "2024", lang: "Hindi", genre: "Action/Sci-Fi", bg: "#1a0a00", emoji: "&#x1F9D9;", poster: "" },
      { id: "m8", title: "Crew", rating: "7.1", year: "2024", lang: "Hindi", genre: "Comedy/Crime", bg: "#00001a", emoji: "&#x1F91F;", poster: "" },
      { id: "m12", title: "Stree 2", rating: "8.4", year: "2024", lang: "Hindi", genre: "Horror/Comedy", bg: "#0a000a", emoji: "&#x1F47B;", poster: "" }
    ]
  };

  var BOT_TIPS = [
    "&#x1F4A1; Morning shows are 30% cheaper!",
    "&#x1F3C6; Use 100 reward points for &#8377;50 off your next booking",
    "&#x1F37F; Pre-order food to skip the counter queue",
    "&#x26A1; IMAX screens available at select theatres",
    "&#x1F3AB; Book 2+ tickets and earn double points!"
  ];

  var chatMsgCount = 0;
  var chatMoviesCache = [];
  var chatbotLoading = false;

  function initChatbot() {
    appendStyleOnce("feature-chatbot-style", [
      ".chatbot-fab{position:fixed;bottom:28px;right:28px;z-index:9000;width:58px;height:58px;border-radius:50%;background:#e50914;border:none;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.5rem;cursor:pointer;transition:all .3s;box-shadow:0 4px 20px rgba(229,9,20,.5)}",
      ".chatbot-fab:hover{transform:scale(1.1);box-shadow:0 8px 28px rgba(229,9,20,.6)}",
      ".chatbot-fab .cb-unread{position:absolute;top:-4px;right:-4px;width:19px;height:19px;border-radius:50%;background:#e5b80b;color:#000;font-size:.62rem;font-weight:700;display:flex;align-items:center;justify-content:center}",
      ".chatbot-win{position:fixed;bottom:100px;right:28px;z-index:9000;width:380px;max-height:580px;background:#1a1a1a;border:1px solid rgba(255,255,255,.1);border-radius:14px;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.9);transition:opacity .3s,transform .3s;transform-origin:bottom right}",
      ".chatbot-win.hidden{opacity:0;transform:scale(.88) translateY(20px);pointer-events:none}",
      ".chatbot-win.visible{opacity:1;transform:scale(1) translateY(0)}",
      ".cb-head{background:linear-gradient(135deg,#e50914,#b81d24);padding:13px 16px;display:flex;align-items:center;gap:11px;border-radius:14px 14px 0 0;flex-shrink:0}",
      ".cb-av{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1.1rem}",
      ".cb-head-info{flex:1}",
      ".cb-head-title{font-weight:700;font-size:.9rem;color:#fff}",
      ".cb-head-sub{font-size:.7rem;opacity:.8;color:#fff}",
      ".cb-online::before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:#46d369;margin-right:4px}",
      ".cb-close-btn{background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;opacity:.8;padding:4px;line-height:1}",
      ".cb-close-btn:hover{opacity:1}",
      ".cb-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:11px;scroll-behavior:smooth}",
      ".cb-body::-webkit-scrollbar{width:3px}",
      ".cb-body::-webkit-scrollbar-thumb{background:#333;border-radius:2px}",
      ".cb-msg{display:flex;gap:8px;animation:cbFadeIn .3s ease;max-width:92%}",
      ".cb-msg.user{flex-direction:row-reverse;align-self:flex-end}",
      ".cb-msg.bot{align-self:flex-start}",
      "@keyframes cbFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}",
      ".cb-av-sm{width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.8rem;margin-top:auto}",
      ".cb-av-bot{background:#e50914}",
      ".cb-av-user{background:#333}",
      ".cb-bubble{padding:9px 13px;border-radius:12px;font-size:.83rem;line-height:1.55;max-width:100%;color:#fff}",
      ".cb-msg.bot .cb-bubble{background:#2a2a2a;border-radius:4px 12px 12px 12px}",
      ".cb-msg.user .cb-bubble{background:#e50914;border-radius:12px 4px 12px 12px}",
      ".cb-typing-wrap{display:flex;gap:8px;align-self:flex-start;animation:cbFadeIn .3s ease}",
      ".cb-typing{display:flex;gap:5px;align-items:center;padding:11px 14px;background:#2a2a2a;border-radius:4px 12px 12px 12px}",
      ".cb-dot{width:7px;height:7px;border-radius:50%;background:#666}",
      ".cb-dot:nth-child(1){animation:cbDot 1.2s ease infinite 0s}",
      ".cb-dot:nth-child(2){animation:cbDot 1.2s ease infinite .2s}",
      ".cb-dot:nth-child(3){animation:cbDot 1.2s ease infinite .4s}",
      "@keyframes cbDot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-7px)}}",
      ".cb-movies-scroll{display:flex;gap:10px;overflow-x:auto;padding:6px 0 8px;margin-top:4px}",
      ".cb-movies-scroll::-webkit-scrollbar{height:2px}",
      ".cb-movies-scroll::-webkit-scrollbar-thumb{background:#444;border-radius:2px}",
      ".cb-movie-card{flex-shrink:0;width:115px;background:#252525;border-radius:8px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s;border:1px solid rgba(255,255,255,.07)}",
      ".cb-movie-card:hover{transform:scale(1.05);box-shadow:0 6px 20px rgba(0,0,0,.6);border-color:rgba(229,9,20,.4)}",
      ".cb-mov-poster{height:82px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:2.2rem}",
      ".cb-mov-poster img{width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0}",
      ".cb-mov-poster .cb-mov-emoji{position:relative;z-index:1;font-size:2.2rem}",
      ".cb-mov-badge{position:absolute;top:4px;right:4px;background:rgba(229,184,11,.9);color:#000;font-size:.58rem;font-weight:700;padding:2px 5px;border-radius:3px;z-index:2}",
      ".cb-mov-info{padding:7px 8px}",
      ".cb-mov-title{font-size:.72rem;font-weight:700;line-height:1.3;margin-bottom:3px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".cb-mov-meta{font-size:.62rem;color:#888;margin-bottom:5px}",
      ".cb-mov-bk{width:100%;background:#e50914;color:#fff;border:none;padding:5px;font-size:.66rem;font-weight:700;cursor:pointer;transition:background .15s;letter-spacing:.3px}",
      ".cb-mov-bk:hover{background:#b81d24}",
      ".cb-chips{display:flex;gap:7px;flex-wrap:wrap;padding:4px 0 0}",
      ".cb-chip{padding:5px 12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:20px;font-size:.76rem;cursor:pointer;transition:all .2s;white-space:nowrap;color:#fff}",
      ".cb-chip:hover{background:#e50914;border-color:#e50914}",
      ".cb-tip{font-size:.71rem;color:#46d369;padding:3px 0;display:flex;align-items:center;gap:5px;background:rgba(70,211,105,.07);border-radius:4px;padding:5px 8px}",
      ".cb-ai-badge{display:inline-flex;align-items:center;gap:4px;font-size:.62rem;color:#888;margin-top:4px;padding:2px 6px;background:rgba(255,255,255,.05);border-radius:3px}",
      ".cb-inp-area{padding:11px 13px;border-top:1px solid rgba(255,255,255,.07);display:flex;gap:8px;flex-shrink:0;align-items:center}",
      ".cb-inp{flex:1;background:#2a2a2a;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:9px 14px;color:#fff;font-size:.83rem;font-family:inherit;outline:none}",
      ".cb-inp::placeholder{color:#555}",
      ".cb-inp:focus{border-color:rgba(229,9,20,.5)}",
      ".cb-send{width:36px;height:36px;min-width:36px;border-radius:50%;background:#e50914;border:none;display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;transition:background .15s;font-size:1rem}",
      ".cb-send:hover{background:#b81d24}",
      ".cb-send:disabled{background:#555;cursor:not-allowed}",
      "@media(max-width:540px){.chatbot-win{right:8px;left:8px;width:auto;bottom:84px;max-height:72vh}.chatbot-fab{right:14px;bottom:14px}}"
    ].join(""));

    if (!document.getElementById("chatFab")) {
      var fab = document.createElement("button");
      fab.className = "chatbot-fab";
      fab.id = "chatFab";
      fab.type = "button";
      fab.innerHTML = "&#x1F916;<div class='cb-unread'>1</div>";
      fab.onclick = window.toggleChatbot;
      document.body.appendChild(fab);
    }

    if (!document.getElementById("chatWin")) {
      var win = document.createElement("div");
      win.className = "chatbot-win hidden";
      win.id = "chatWin";
      win.innerHTML = [
        '<div class="cb-head">',
          '<div class="cb-av">&#x1F916;</div>',
          '<div class="cb-head-info">',
            '<div class="cb-head-title">Movie Assistant</div>',
            '<div class="cb-head-sub"><span class="cb-online"></span>AI Powered &bull; Always Online</div>',
          '</div>',
          '<button class="cb-close-btn" onclick="toggleChatbot()">&#x2715;</button>',
        '</div>',
        '<div class="cb-body" id="cbBody">',
          '<div class="cb-msg bot">',
            '<div class="cb-av-sm cb-av-bot">&#x1F916;</div>',
            '<div>',
              '<div class="cb-bubble">Hey! I\'m your AI Movie Assistant &#x1F3AC;<br>Ask me for movie recommendations, show timings, deals, or anything cinema!</div>',
              '<div class="cb-tip">&#x1F4A1; Morning shows are 30% cheaper!</div>',
              '<div class="cb-chips">',
                '<div class="cb-chip" onclick="sendChatMsg(\'Action movies tonight\')">Action</div>',
                '<div class="cb-chip" onclick="sendChatMsg(\'Romantic movies under 2hrs\')">Romantic</div>',
                '<div class="cb-chip" onclick="sendChatMsg(\'Family movies for kids\')">Family</div>',
                '<div class="cb-chip" onclick="sendChatMsg(\'Best horror movies\')">Horror</div>',
                '<div class="cb-chip" onclick="sendChatMsg(\'Cheap morning shows\')">Cheap Shows</div>',
              '</div>',
            '</div>',
          '</div>',
        '</div>',
        '<div class="cb-inp-area">',
          '<input class="cb-inp" id="cbInput" placeholder="Ask me anything about movies...">',
          '<button class="cb-send" id="cbSendBtn" onclick="sendChatMsg()">&#x27A4;</button>',
        '</div>'
      ].join("");
      document.body.appendChild(win);

      var input = document.getElementById("cbInput");
      if (input) {
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            window.sendChatMsg();
          }
        });
      }
    }

    // Preload movies from site API
    safeAPIGet("/movies?limit=50")
      .then(function (d) {
        if (d && d.success && Array.isArray(d.movies)) chatMoviesCache = d.movies;
      })
      .catch(function () {});
  }

  window.toggleChatbot = function () {
    var win = document.getElementById("chatWin");
    var fab = document.getElementById("chatFab");
    if (!win) return;

    var isOpen = win.classList.contains("visible");
    win.classList.toggle("visible", !isOpen);
    win.classList.toggle("hidden", isOpen);

    var badge = fab && fab.querySelector(".cb-unread");
    if (badge) badge.remove();
  };

  // Core: call Anthropic API for movie suggestions
  function callAnthropicForMovies(userQuery) {
    var systemPrompt = [
      "You are a Bollywood and Hollywood movie recommendation assistant for an Indian cinema ticketing app.",
      "When given a user query about movies, respond with a JSON object ONLY — no markdown, no explanation.",
      "Format: {\"reply\":\"short friendly reply 1-2 sentences\",\"movies\":[{\"title\":\"Movie Name\",\"year\":\"2024\",\"lang\":\"Hindi\",\"genre\":\"Action/Drama\",\"rating\":\"8.2\",\"desc\":\"one-line plot\",\"emoji\":\"🎬\"},...]}",
      "Include 3-4 movies relevant to the query.",
      "Prioritize recent Indian movies (2023-2025) but include Hollywood if relevant.",
      "Return ONLY valid JSON, nothing else."
    ].join(" ");

    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userQuery }]
      })
    })
    .then(function (res) {
      if (!res.ok) throw new Error("API error " + res.status);
      return res.json();
    })
    .then(function (data) {
      var text = "";
      if (data && data.content && data.content.length) {
        for (var i = 0; i < data.content.length; i++) {
          if (data.content[i].type === "text") text += data.content[i].text;
        }
      }
      // Strip any accidental markdown fences
      text = text.replace(/```json|```/gi, "").trim();
      return JSON.parse(text);
    });
  }

  // Determine genre key from user message for fallback
  function detectGenre(msg) {
    var lower = msg.toLowerCase();
    if (lower.match(/action|fight|war|adventure/)) return "action";
    if (lower.match(/thriller|suspense|crime|mystery/)) return "thriller";
    if (lower.match(/comedy|funny|laugh|comic/)) return "comedy";
    if (lower.match(/romance|love|romantic|date/)) return "romance";
    if (lower.match(/horror|scary|ghost|spook/)) return "horror";
    if (lower.match(/sci.?fi|science|space|future/)) return "scifi";
    return "default";
  }

  function buildMovieCardHtml(movie, index) {
    var bgColors = ["#1a0a00", "#00101a", "#0a0010", "#001a0a", "#0a000a", "#1a1000", "#000a1a"];
    var bg = movie.bg || bgColors[index % bgColors.length];
    var title = escapeHtml((movie.title || "").slice(0, 22)) + ((movie.title || "").length > 22 ? "..." : "");
    var rating = escapeHtml(movie.rating || "");
    var genre = escapeHtml((movie.genre || "").slice(0, 18));
    var lang = escapeHtml(movie.lang || "");
    var year = escapeHtml(movie.year || "");
    var emoji = movie.emoji || "&#x1F3AC;";
    var id = escapeHtml(movie.id || movie.title || "");

    // Try poster image, fallback to emoji
    var posterHtml = movie.poster
      ? '<img src="' + escapeHtml(movie.poster) + '" alt="' + title + '" onerror="this.style.display=\'none\'">' +
        '<div class="cb-mov-emoji" style="display:none">' + emoji + '</div>'
      : '<div class="cb-mov-emoji">' + emoji + '</div>';

    return [
      '<div class="cb-movie-card" onclick="location.href=\'movie.html?id=' + encodeURIComponent(id) + '\'">',
        '<div class="cb-mov-poster" style="background:' + bg + '">',
          posterHtml,
          rating ? '<div class="cb-mov-badge">&#9733; ' + rating + '</div>' : "",
        '</div>',
        '<div class="cb-mov-info">',
          '<div class="cb-mov-title">' + title + '</div>',
          '<div class="cb-mov-meta">' + year + (lang ? " &bull; " + lang : "") + '</div>',
          genre ? '<div style="font-size:.6rem;color:#e5b80b;margin-bottom:4px">' + genre + '</div>' : "",
        '</div>',
        '<button class="cb-mov-bk" onclick="event.stopPropagation();location.href=\'movie.html?id=' + encodeURIComponent(id) + '\'">Book Now &rsaquo;</button>',
      '</div>'
    ].join("");
  }

  function addTypingIndicator(body) {
    var wrap = document.createElement("div");
    wrap.className = "cb-typing-wrap";
    wrap.id = "cbTyping";
    wrap.innerHTML = [
      '<div class="cb-av-sm cb-av-bot">&#x1F916;</div>',
      '<div class="cb-typing">',
        '<div class="cb-dot"></div><div class="cb-dot"></div><div class="cb-dot"></div>',
      '</div>'
    ].join("");
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
    return wrap;
  }

  function removeTypingIndicator() {
    var el = document.getElementById("cbTyping");
    if (el) el.parentNode && el.parentNode.removeChild(el);
  }

  function addBotMovieResponse(body, reply, movies) {
    var botEl = document.createElement("div");
    botEl.className = "cb-msg bot";

    var cardsHtml = "";
    if (movies && movies.length) {
      cardsHtml = '<div class="cb-movies-scroll">';
      for (var i = 0; i < movies.length; i++) {
        cardsHtml += buildMovieCardHtml(movies[i], i);
      }
      cardsHtml += '</div>';
      cardsHtml += '<div class="cb-ai-badge">&#x2728; AI Recommendations</div>';
    }

    var quickReplies = [
      "Show me more like these",
      "Any morning shows?",
      "IMAX available?",
      "Best deals today"
    ];
    var chipsHtml = '<div class="cb-chips">';
    for (var q = 0; q < quickReplies.length; q++) {
      chipsHtml += '<div class="cb-chip" onclick="sendChatMsg(\'' + quickReplies[q].replace(/'/g, "") + '\')">' + quickReplies[q] + '</div>';
    }
    chipsHtml += '</div>';

    botEl.innerHTML = [
      '<div class="cb-av-sm cb-av-bot">&#x1F916;</div>',
      '<div>',
        '<div class="cb-bubble">' + escapeHtml(reply) + '</div>',
        cardsHtml,
        chipsHtml,
      '</div>'
    ].join("");

    body.appendChild(botEl);
    body.scrollTop = body.scrollHeight;
  }

  function addBotTextResponse(body, text, showTip) {
    var botEl = document.createElement("div");
    botEl.className = "cb-msg bot";

    var tipHtml = showTip ? '<div class="cb-tip">' + BOT_TIPS[Math.floor(Math.random() * BOT_TIPS.length)] + '</div>' : "";

    botEl.innerHTML = [
      '<div class="cb-av-sm cb-av-bot">&#x1F916;</div>',
      '<div>',
        '<div class="cb-bubble">' + escapeHtml(text) + '</div>',
        tipHtml,
      '</div>'
    ].join("");

    body.appendChild(botEl);
    body.scrollTop = body.scrollHeight;
  }

  window.sendChatMsg = function (prefill) {
    if (chatbotLoading) return;

    var inp = document.getElementById("cbInput");
    var body = document.getElementById("cbBody");
    var sendBtn = document.getElementById("cbSendBtn");
    var rawMsg = prefill || (inp && inp.value && inp.value.trim()) || "";
    var msg = String(rawMsg).trim();

    if (!msg || !body) return;
    if (inp) inp.value = "";

    // Add user message
    var userEl = document.createElement("div");
    userEl.className = "cb-msg user";
    userEl.innerHTML = '<div class="cb-av-sm cb-av-user">&#x1F464;</div><div class="cb-bubble">' + escapeHtml(msg) + '</div>';
    body.appendChild(userEl);
    body.scrollTop = body.scrollHeight;

    // Show typing
    chatbotLoading = true;
    if (sendBtn) sendBtn.disabled = true;
    var typingEl = addTypingIndicator(body);

    // Handle simple info queries without API call
    var lower = msg.toLowerCase();
    var simpleReplies = {
      morning: "Morning shows (before 12 PM) are 30% cheaper! Check the calendar section on any movie page for timings. Great way to save on tickets!",
      discount: "Current deals: 30% off morning shows, double reward points on weekends, and &#8377;50 off for reward members. Use code MZFIRST for your first booking!",
      imax: "IMAX screens are available at PVR IMAX Juhu (2.4km), INOX Nariman Point (8.7km), and Cinepolis Mall of India. Premium experience with crystal-clear visuals!",
      deal: "Hot deals right now: Morning shows 30% off, Book 2 get &#8377;100 off, Weekend family package, and earn 2x reward points on every booking this week!",
      reward: "You earn 1 reward point per &#8377;10 spent! 100 points = &#8377;50 discount. Silver members get 1x, Gold 1.5x, and Platinum members get 2x points per booking.",
      hello: "Hey there! &#x1F44B; I\'m here to help you find the perfect movie and show. What are you in the mood for today?",
      hi: "Hi! Great to see you! &#x1F603; What kind of movie are you feeling — action, romance, comedy, or something else?",
      thanks: "Happy to help! &#x1F604; Is there anything else you\'d like to know about movies or bookings?",
      bye: "Goodbye! &#x1F44B; Enjoy your movie! Don\'t forget to pre-order food to skip the queue."
    };

    var simpleKey = null;
    var simpleKeys = Object.keys(simpleReplies);
    for (var sk = 0; sk < simpleKeys.length; sk++) {
      if (lower.includes(simpleKeys[sk])) { simpleKey = simpleKeys[sk]; break; }
    }

    chatMsgCount++;
    var showTip = chatMsgCount % 3 === 0;

    if (simpleKey) {
      setTimeout(function () {
        removeTypingIndicator();
        addBotTextResponse(body, simpleReplies[simpleKey], showTip);
        chatbotLoading = false;
        if (sendBtn) sendBtn.disabled = false;
      }, 700);
      return;
    }

    // Use Anthropic API for movie recommendations
    callAnthropicForMovies(msg)
      .then(function (result) {
        removeTypingIndicator();

        var reply = (result && result.reply) ? result.reply : "Here are some great picks for you!";
        var aiMovies = (result && Array.isArray(result.movies)) ? result.movies : [];

        // Merge with site movies if available
        if (chatMoviesCache.length && aiMovies.length) {
          var genre = detectGenre(msg);
          var siteMatches = chatMoviesCache.filter(function (m) {
            return Array.isArray(m.genre) && m.genre.some(function (g) {
              return String(g).toLowerCase().includes(genre);
            });
          }).slice(0, 2);

          // Tag site movies with poster if available
          for (var sm = 0; sm < siteMatches.length; sm++) {
            var sm_movie = siteMatches[sm];
            aiMovies.unshift({
              id: sm_movie._id || sm_movie.id || "",
              title: sm_movie.title || "",
              year: sm_movie.year || "Now Showing",
              lang: sm_movie.language || sm_movie.lang || "Hindi",
              genre: Array.isArray(sm_movie.genre) ? sm_movie.genre.join("/") : (sm_movie.genre || ""),
              rating: sm_movie.rating || "",
              emoji: sm_movie.poster || "&#x1F3AC;",
              poster: (typeof sm_movie.poster === "string" && sm_movie.poster.startsWith("http")) ? sm_movie.poster : "",
              bg: sm_movie.bg || ""
            });
          }
          aiMovies = aiMovies.slice(0, 5);
        }

        if (!aiMovies.length) {
          // Fallback to hardcoded movies
          var genre2 = detectGenre(msg);
          aiMovies = FALLBACK_MOVIES[genre2] || FALLBACK_MOVIES["default"];
        }

        addBotMovieResponse(body, reply, aiMovies);

        if (showTip) {
          setTimeout(function () {
            var tipEl = document.createElement("div");
            tipEl.className = "cb-msg bot";
            tipEl.innerHTML = '<div class="cb-av-sm cb-av-bot">&#x1F916;</div><div class="cb-tip">' + BOT_TIPS[Math.floor(Math.random() * BOT_TIPS.length)] + '</div>';
            body.appendChild(tipEl);
            body.scrollTop = body.scrollHeight;
          }, 400);
        }
      })
      .catch(function (err) {
        console.warn("[Chatbot] API failed, using fallback:", err);
        removeTypingIndicator();

        var genre3 = detectGenre(msg);
        var fallbackMovies = FALLBACK_MOVIES[genre3] || FALLBACK_MOVIES["default"];
        var fallbackReplies = {
          action: "Here are tonight\'s top Action picks! Hold tight for intense cinema!",
          thriller: "Edge-of-seat Thrillers that will keep you guessing!",
          comedy: "Laugh-out-loud Comedies guaranteed to brighten your day!",
          romance: "Perfect Romantic films for a special evening!",
          horror: "Spooky picks for the brave-hearted!",
          scifi: "Mind-blowing Sci-Fi adventures await!",
          "default": "Here are some great movies showing now!"
        };

        addBotMovieResponse(body, fallbackReplies[genre3] || fallbackReplies["default"], fallbackMovies);
      })
      .then(function () {
        chatbotLoading = false;
        if (sendBtn) sendBtn.disabled = false;
      });
  };

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FEATURE 5: CALENDAR BOOKING VIEW
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  var CINEMAS_DATA = [
    {
      name: "PVR IMAX Juhu, Mumbai", tags: ["IMAX", "DOLBY", "F&B"], dist: "2.4 km",
      shows: {
        "2D": [{ t: "10:30 AM", s: "", seats: 142 }, { t: "1:45 PM", s: "filling", seats: 43 }, { t: "5:00 PM", s: "almost", seats: 12 }, { t: "8:30 PM", s: "", seats: 156 }, { t: "11:45 PM", s: "", seats: 190 }],
        "IMAX 2D": [{ t: "11:00 AM", s: "", seats: 80 }, { t: "2:30 PM", s: "filling", seats: 22 }, { t: "7:00 PM", s: "almost", seats: 8 }]
      }
    },
    {
      name: "Cinepolis Andheri West", tags: ["RECLINER", "DOLBY"], dist: "4.1 km",
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

  var calSelDate = "Today";
  var calSelFmt = "All";

  function renderCalendarBooking(movieId, movieFormats) {
    var section = document.getElementById("calendarBookingSection");
    if (!section) return;

    appendStyleOnce("feature-calendar-style", [
      ".cal-bk-wrap{background:#111;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:18px;margin-bottom:16px}",
      ".cal-bk-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}",
      ".cal-bk-title{font-family:'Rajdhani',sans-serif;font-size:1rem;font-weight:700;color:#fff}",
      ".cal-date-strip{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:14px}",
      ".cal-date-strip::-webkit-scrollbar{height:2px}",
      ".cal-date-btn{flex-shrink:0;min-width:62px;padding:9px 12px;border-radius:5px;border:1px solid rgba(255,255,255,.1);background:transparent;color:#b3b3b3;font-family:'Exo 2',sans-serif;font-size:.78rem;text-align:center;cursor:pointer;transition:all .2s}",
      ".cal-date-btn.on{background:#e50914;border-color:#e50914;color:#fff}",
      ".cal-date-btn:hover:not(.on){border-color:rgba(255,255,255,.25);color:#fff}",
      ".cal-d-num{display:block;font-weight:700;font-size:.96rem}",
      ".cal-d-day{font-size:.62rem;opacity:.8;display:block}",
      ".cal-d-today{font-size:.58rem;color:#46d369;font-weight:700;display:block}",
      ".cal-fmt-filters{display:flex;gap:7px;margin-bottom:14px;flex-wrap:wrap}",
      ".cal-fmt-btn{padding:5px 13px;border-radius:20px;font-size:.76rem;font-weight:600;border:1px solid rgba(255,255,255,.14);background:transparent;color:#b3b3b3;cursor:pointer;transition:all .2s}",
      ".cal-fmt-btn.on{background:#e50914;border-color:#e50914;color:#fff}",
      ".cal-fmt-btn:hover:not(.on){border-color:rgba(255,255,255,.25);color:#fff}",
      ".cal-legend{display:flex;gap:14px;margin-bottom:12px;font-size:.72rem;color:#808080;flex-wrap:wrap}",
      ".cal-cinema-list{display:flex;flex-direction:column;gap:10px}",
      ".cal-cinema-card{background:#1a1a1a;border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:13px;transition:border-color .2s}",
      ".cal-cinema-card:hover{border-color:rgba(255,255,255,.14)}",
      ".cal-cinema-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px}",
      ".cal-cinema-name{font-weight:700;font-size:.9rem;margin-bottom:3px;color:#fff}",
      ".cal-cinema-tags{display:flex;gap:5px;flex-wrap:wrap}",
      ".cal-tag{font-size:.6rem;padding:1px 7px;border-radius:2px;background:rgba(255,255,255,.06);color:#808080}",
      ".cal-cinema-dist{font-size:.72rem;color:#808080;white-space:nowrap}",
      ".cal-show-slots{display:flex;gap:8px;flex-wrap:wrap}",
      ".cal-slot{padding:7px 14px;border:1px solid rgba(255,255,255,.14);border-radius:5px;font-size:.84rem;font-weight:700;color:#fff;cursor:pointer;font-family:'Rajdhani',sans-serif;transition:all .2s;text-align:center;min-width:78px}",
      ".cal-slot:hover{border-color:#e50914;color:#e50914;background:rgba(229,9,20,.06)}",
      ".cal-slot.filling{border-color:rgba(255,165,0,.5);color:#ffa500}",
      ".cal-slot.almost{border-color:rgba(229,9,20,.5);color:#e50914}",
      ".cal-slot-status{display:block;font-size:.58rem;font-family:'Exo 2',sans-serif;font-weight:400;margin-top:1px;color:#46d369}",
      ".cal-slot.filling .cal-slot-status{color:#ffa500}",
      ".cal-slot.almost .cal-slot-status{color:#e50914}",
      ".cal-slot-seats{display:block;font-size:.58rem;font-family:'Exo 2',sans-serif;font-weight:400;color:#808080;margin-top:1px}"
    ].join(""));

    var formats = ["All"].concat(movieFormats || ["2D", "IMAX 2D", "DOLBY", "4DX"]);

    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var today = new Date();
    var dateButtons = "";

    for (var i = 0; i < 7; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      var label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : days[d.getDay()] + " " + d.getDate();
      dateButtons += [
        '<button class="cal-date-btn ' + (i === 0 ? "on" : "") + '" onclick="calSelectDate(this,\'' + label + '\')">',
          '<span class="cal-d-num">' + d.getDate() + '</span>',
          '<span class="cal-d-day">' + days[d.getDay()] + ", " + months[d.getMonth()] + '</span>',
          i === 0 ? '<span class="cal-d-today">Today</span>' : "",
        '</button>'
      ].join("");
    }

    var fmtBtns = "";
    for (var f = 0; f < formats.length; f++) {
      fmtBtns += '<button class="cal-fmt-btn ' + (f === 0 ? "on" : "") + '" onclick="calSelectFmt(this,\'' + escapeHtml(formats[f]) + '\')">' + escapeHtml(formats[f]) + '</button>';
    }

    section.innerHTML = [
      '<div class="cal-bk-wrap">',
        '<div class="cal-bk-header">',
          '<div class="cal-bk-title">&#x1F4C5; Select Date &amp; Show</div>',
          '<div style="font-size:.74rem;color:#808080">7 days available</div>',
        '</div>',
        '<div class="cal-date-strip">' + dateButtons + '</div>',
        '<div class="cal-fmt-filters">' + fmtBtns + '</div>',
        '<div class="cal-legend">',
          '<span><span style="color:#46d369">&#x25CF;</span> Available</span>',
          '<span><span style="color:#ffa500">&#x25CF;</span> Filling Fast</span>',
          '<span><span style="color:#e50914">&#x25CF;</span> Almost Full</span>',
        '</div>',
        '<div class="cal-cinema-list" id="calCinemaList"></div>',
      '</div>'
    ].join("");

    renderCalCinemas(movieId);
  }

  window.calSelectDate = function (btn, date) {
    qsa(".cal-date-btn").forEach(function (b) { b.classList.remove("on"); });
    btn.classList.add("on");
    calSelDate = date;
    renderCalCinemas(new URLSearchParams(location.search).get("id"));
  };

  window.calSelectFmt = function (btn, fmt) {
    qsa(".cal-fmt-btn").forEach(function (b) { b.classList.remove("on"); });
    btn.classList.add("on");
    calSelFmt = fmt;
    renderCalCinemas(new URLSearchParams(location.search).get("id"));
  };

  function renderCalCinemas(movieId) {
    var list = document.getElementById("calCinemaList");
    if (!list) return;

    var cinemas = CINEMAS_DATA.filter(function (c) {
      if (calSelFmt === "All") return true;
      return Object.keys(c.shows).some(function (fmt) {
        return fmt.toLowerCase().includes(calSelFmt.toLowerCase()) || calSelFmt.toLowerCase().includes(fmt.split(" ")[0].toLowerCase());
      });
    });

    if (!cinemas.length) {
      list.innerHTML = '<div style="text-align:center;padding:30px;color:#808080">No shows available for selected format</div>';
      return;
    }

    var html = "";
    for (var ci = 0; ci < cinemas.length; ci++) {
      var c = cinemas[ci];
      var fmts = calSelFmt === "All"
        ? Object.keys(c.shows)
        : Object.keys(c.shows).filter(function (f) {
            return f.toLowerCase().includes(calSelFmt.toLowerCase()) || calSelFmt === "All";
          });

      var selectedFmt = fmts[0] || "2D";
      var showArr = c.shows[selectedFmt] || [];
      var slots = "";
      for (var si = 0; si < showArr.length; si++) {
        var s = showArr[si];
        var statusText = s.s === "almost" ? "Almost Full" : s.s === "filling" ? "Filling Fast" : "Available";
        slots += [
          '<div class="cal-slot ' + s.s + '" onclick="handleCalBooking(\'' + encodeURIComponent(movieId || "") + '\',\'' + encodeURIComponent(c.name) + '\',\'' + s.t + '\',\'' + calSelDate + '\',\'' + selectedFmt + '\')">',
            s.t,
            '<span class="cal-slot-status">' + statusText + '</span>',
            '<span class="cal-slot-seats">' + s.seats + ' seats</span>',
          '</div>'
        ].join("");
      }

      var tagsHtml = "";
      for (var ti = 0; ti < c.tags.length; ti++) {
        tagsHtml += '<span class="cal-tag">' + escapeHtml(c.tags[ti]) + '</span>';
      }

      html += [
        '<div class="cal-cinema-card">',
          '<div class="cal-cinema-head">',
            '<div>',
              '<div class="cal-cinema-name">' + escapeHtml(c.name) + '</div>',
              '<div class="cal-cinema-tags">' + tagsHtml + '</div>',
            '</div>',
            '<div class="cal-cinema-dist">&#x1F4CD; ' + escapeHtml(c.dist) + '</div>',
          '</div>',
          '<div class="cal-show-slots">' + slots + '</div>',
        '</div>'
      ].join("");
    }

    list.innerHTML = html;
  }

  window.handleCalBooking = function (movieId, cinema, time, date, format) {
    if (!isLoggedInSafe()) {
      safeToast("Please login to book tickets", "warn");
      setTimeout(function () {
        location.href = "login.html?redirect=" + encodeURIComponent(location.href);
      }, 800);
      return;
    }

    if (typeof window.showSeatCountPopup === "function") {
      try {
        window.showSeatCountPopup(
          decodeURIComponent(movieId || ""),
          decodeURIComponent(cinema || ""),
          time, date, format
        );
      } catch (e) {
        safeToast("Selected: " + decodeURIComponent(cinema) + " \u2022 " + time + " \u2022 " + date, "success");
      }
      return;
    }

    safeToast("Selected: " + decodeURIComponent(cinema) + " \u2022 " + time + " \u2022 " + date + " \u2022 " + format, "success");
  };

  window.renderCalendarBooking = renderCalendarBooking;

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     MASTER INIT
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  function masterInit() {
    initVoiceSearch();
    initChatbot();
    initFoodPreOrder();
    initRewardsSystem();
    setTimeout(injectMicToNavbar, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", masterInit);
  } else {
    masterInit();
  }

  // Hook into mountNavbar if available
  var _origMount = window.mountNavbar;
  if (typeof _origMount === "function" && !_origMount.__featuresWrapped) {
    var wrapped = function () {
      _origMount.apply(this, arguments);
      setTimeout(injectMicToNavbar, 100);
    };
    wrapped.__featuresWrapped = true;
    window.mountNavbar = wrapped;
  }

})();