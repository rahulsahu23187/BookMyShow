// js/events.js
(function () {
  "use strict";

  function safeToast(msg, type = "info", ms = 2600) {
    if (
      typeof window.TOAST !== "undefined" &&
      window.TOAST &&
      typeof window.TOAST.show === "function"
    ) {
      window.TOAST.show(msg, type, ms);
    } else {
      console.log(`[${type}] ${msg}`);
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

  function isLoggedInSafe() {
    if (
      typeof window.SESSION !== "undefined" &&
      window.SESSION &&
      typeof window.SESSION.isLoggedIn === "function"
    ) {
      return window.SESSION.isLoggedIn();
    }
    return !!localStorage.getItem("mz_token");
  }

  function getCurrentCity() {
    return localStorage.getItem("mz_city") || "Mumbai";
  }

  function normalizeCity(city) {
    return String(city || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function getAllEventCards() {
    return Array.from(document.querySelectorAll(".ev-card, .sport-card, [data-city]"));
  }

  function setActiveChip(btn) {
    document.querySelectorAll(".city-chip, .f-chip").forEach(function (chip) {
      chip.classList.remove("on");
    });
    if (btn) btn.classList.add("on");
  }

  function filterEvents(city, btn) {
    setActiveChip(btn);

    const wanted = normalizeCity(city);
    let count = 0;

    getAllEventCards().forEach(function (card) {
      const cardCity = normalizeCity(card.getAttribute("data-city") || "Mumbai");
      const show =
        wanted === "all" ||
        cardCity === wanted ||
        cardCity.includes(wanted) ||
        wanted.includes(cardCity);

      card.style.display = show ? "" : "none";
      if (show) count++;
    });

    if (wanted === "all") {
      safeToast("Showing all events (" + count + ")", "info");
    } else {
      safeToast("Showing " + count + " events in " + city, "info");
    }
  }

  function saveRecentEvent(data) {
    try {
      localStorage.setItem("mz_last_event_booking", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save recent event:", err);
    }
  }

  function makeEventPayload(name, price, extra) {
    extra = extra || {};
    return {
      id: extra.id || ("EV" + Date.now()),
      eventId: extra.eventId || extra.id || "",
      type: "event",
      name: String(name || "Unknown Event"),
      title: String(name || "Unknown Event"),
      price: Number(price || 0),
      city: extra.city || getCurrentCity(),
      venue: extra.venue || "",
      date: extra.date || "",
      category: extra.category || "",
      description: extra.description || "",
      bookedAt: new Date().toISOString()
    };
  }

  function redirectToEventBooking(eventData) {
    saveRecentEvent(eventData);

    const qs = new URLSearchParams({
      id: eventData.eventId || eventData.id || "",
      name: eventData.name || "",
      price: String(eventData.price || 0),
      city: eventData.city || "",
      venue: eventData.venue || "",
      date: eventData.date || "",
      category: eventData.category || "",
      description: eventData.description || ""
    });

    safeToast("Opening booking for: " + eventData.name, "info");

    setTimeout(function () {
      location.href = "event-booking.html?" + qs.toString();
    }, 350);
  }

  function bookEvent(nameOrId, price, meta) {
    meta = meta || {};

    if (!isLoggedInSafe()) {
      safeToast("Please login to book tickets", "warn", 3000);
      setTimeout(function () {
        location.href = "login.html?redirect=" + encodeURIComponent(location.href);
      }, 700);
      return;
    }

    const eventData = makeEventPayload(nameOrId, price, meta);
    redirectToEventBooking(eventData);
  }

  function bindCardButtons() {
    document.querySelectorAll(".ev-card").forEach(function (card) {
      const btn = card.querySelector(".ev-bk-btn");
      if (!btn || btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const name =
          btn.dataset.name ||
          (card.querySelector(".ev-name") && card.querySelector(".ev-name").textContent.trim()) ||
          "Unknown Event";

        let priceValue =
          btn.dataset.price ||
          (card.querySelector(".ev-price") &&
            card.querySelector(".ev-price").textContent.replace(/[^\d]/g, "")) ||
          "0";

        priceValue = parseInt(priceValue, 10) || 0;

        const metaSpans = card.querySelectorAll(".ev-meta span");

        const venue = metaSpans[0]
          ? metaSpans[0].textContent.replace("📍", "").trim()
          : "";

        const detail = metaSpans[1]
          ? metaSpans[1].textContent.replace("⏰", "").trim()
          : "";

        const date =
          (card.querySelector(".ev-date-badge") &&
            card.querySelector(".ev-date-badge").textContent.trim()) ||
          "";

        const city = card.getAttribute("data-city") || getCurrentCity();

        bookEvent(name, priceValue, {
          venue: venue,
          date: date,
          city: city,
          category: detail,
          description: detail
        });
      });
    });

    document.querySelectorAll(".sport-card").forEach(function (card) {
      if (card.dataset.bound === "1") return;
      card.dataset.bound = "1";

      card.addEventListener("click", function () {
        const name =
          (card.querySelector(".sport-nm") &&
            card.querySelector(".sport-nm").textContent.trim()) ||
          "Sports Event";

        let priceValue =
          (card.querySelector(".sport-pr") &&
            card.querySelector(".sport-pr").textContent.replace(/[^\d]/g, "")) ||
          "0";

        priceValue = parseInt(priceValue, 10) || 0;

        const venue =
          (card.querySelector(".sport-dt") &&
            card.querySelector(".sport-dt").textContent.trim()) ||
          "";

        const city = card.getAttribute("data-city") || getCurrentCity();

        bookEvent(name, priceValue, {
          venue: venue,
          city: city,
          date: venue,
          category: "Sports Event",
          description: venue
        });
      });
    });
  }

  function applyDefaultCityFilter() {
    const currentCity = getCurrentCity();
    const chips = Array.from(document.querySelectorAll(".city-chip"));

    const matchBtn = chips.find(function (btn) {
      const txt = normalizeCity(btn.textContent.replace(/[^\w\s-]/g, ""));
      return txt.includes(normalizeCity(currentCity));
    });

    if (matchBtn) {
      filterEvents(currentCity, matchBtn);
      return;
    }

    const allBtn = chips.find(function (btn) {
      return normalizeCity(btn.textContent).includes("all");
    });

    if (allBtn) {
      filterEvents("all", allBtn);
    } else {
      filterEvents("all", null);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    safeMountNavbar();
    bindCardButtons();
    applyDefaultCityFilter();
    safeHideLoader();
  });

  window.filterEvents = filterEvents;
  window.bookEvent = bookEvent;
})();