// js/config.js

const API_BASE =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://YOUR-BACKEND-NAME.onrender.com/api';
const API = {
  async req(method, endpoint, data = null, options = {}) {
    const token = localStorage.getItem('mz_token');

    const headers = {
      Accept: 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const upperMethod = String(method || 'GET').toUpperCase();
    const isGetLike = upperMethod === 'GET' || upperMethod === 'HEAD';
    const hasBody = !isGetLike && data !== undefined && data !== null;

    if (hasBody && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    let url = API_BASE + endpoint;

    // optional query params support
    if (options.params && typeof options.params === 'object') {
      const qs = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        qs.append(key, String(value));
      });
      const queryString = qs.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const controller = new AbortController();
    const timeoutMs =
      typeof options.timeout === 'number' && options.timeout > 0
        ? options.timeout
        : 15000;

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const fetchOptions = {
      method: upperMethod,
      headers,
      signal: controller.signal,
      cache: 'no-store'
    };

    if (hasBody) {
      fetchOptions.body =
        headers['Content-Type'] &&
        headers['Content-Type'].includes('application/json')
          ? JSON.stringify(data)
          : data;
    }

    let res;

    try {
      res = await fetch(url, fetchOptions);
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new Error('Request timeout. Server took too long to respond.');
      }

      throw new Error('Unable to connect to server. Check backend/API URL.');
    } finally {
      clearTimeout(timeoutId);
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    let payload = null;

    try {
      if (res.status === 204) {
        payload = { success: true };
      } else if (contentType.includes('application/json')) {
        payload = await res.json();
      } else {
        const text = await res.text();
        payload = {
          success: res.ok,
          message: text || `HTTP ${res.status}`
        };
      }
    } catch (err) {
      payload = {
        success: false,
        message: `Invalid server response (HTTP ${res.status})`
      };
    }

    if (!res.ok) {
      const msg =
        payload?.message ||
        payload?.error ||
        payload?.msg ||
        payload?.details ||
        `Request failed with status ${res.status}`;

      // only clear on auth failure, not on 500
      if (res.status === 401 || res.status === 403) {
        SESSION.clear();
      }

      const error = new Error(msg);
      error.status = res.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  },

  get(endpoint, options = {}) {
    return this.req('GET', endpoint, null, options);
  },

  post(endpoint, data, options = {}) {
    return this.req('POST', endpoint, data, options);
  },

  put(endpoint, data, options = {}) {
    return this.req('PUT', endpoint, data, options);
  },

  patch(endpoint, data, options = {}) {
    return this.req('PATCH', endpoint, data, options);
  },

  delete(endpoint, options = {}) {
    return this.req('DELETE', endpoint, null, options);
  }
};

const SESSION = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('mz_user') || 'null');
    } catch (err) {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('mz_token') || null;
  },

  set(user, token) {
    localStorage.setItem('mz_user', JSON.stringify(user || null));

    if (token) {
      localStorage.setItem('mz_token', token);
    }
  },

  updateUser(user) {
    localStorage.setItem('mz_user', JSON.stringify(user || null));
  },

  clear() {
    localStorage.removeItem('mz_user');
    localStorage.removeItem('mz_token');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  async syncMe() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const d = await API.get('/auth/me');
      const user = d?.user || d?.data || null;

      if (user) {
        this.updateUser(user);
      }

      return user;
    } catch (err) {
      console.warn('SESSION.syncMe failed:', err.message);

      // invalid token already cleared in API.req on 401/403
      return null;
    }
  }
};

const TOAST = {
  _wrap: null,

  _init() {
    if (!this._wrap) {
      this._wrap = document.createElement('div');
      this._wrap.className = 'toast-wrap';
      document.body.appendChild(this._wrap);
    }
    return this._wrap;
  },

  show(msg, type = 'info', ms = 3200) {
    const wrap = this._init();

    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warn: '⚠️'
    };

    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    wrap.appendChild(t);

    requestAnimationFrame(() => {
      t.classList.add('show');
    });

    setTimeout(() => {
      t.classList.remove('show');
      t.style.opacity = '0';
      t.style.transform = 'translateX(16px)';
      t.style.transition = 'all .3s ease';
      setTimeout(() => t.remove(), 320);
    }, ms);
  }
};

// theme apply
(function applySavedTheme() {
  const apply = () => {
    if (!document.body) return;

    if (localStorage.getItem('mz_dark') === 'false') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();

// optional helper: safe startup auth sync
document.addEventListener('DOMContentLoaded', async () => {
  if (SESSION.getToken() && !SESSION.getUser()) {
    await SESSION.syncMe();
  }
});