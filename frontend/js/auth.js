// js/auth.js

function initSignup() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  const passInput = document.getElementById('sPass');
  if (passInput) {
    passInput.addEventListener('input', function () {
      const p = this.value;
      const fill = document.getElementById('strFill');
      const txt = document.getElementById('strTxt');

      let s = 0;
      if (p.length >= 6) s++;
      if (p.length >= 10) s++;
      if (/[A-Z]/.test(p)) s++;
      if (/[0-9]/.test(p)) s++;
      if (/[^A-Za-z0-9]/.test(p)) s++;

      const colors = ['', '#e50914', '#ff6b35', '#f5c518', '#22c55e', '#22c55e'];
      const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

      if (fill) {
        fill.style.width = (s * 20) + '%';
        fill.style.background = colors[s] || '#e50914';
      }

      if (txt) {
        txt.textContent = s ? labels[s] : '';
      }
    });
  }

  bindEyeToggles();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErr();

    const name = v('sName');
    const email = v('sEmail').toLowerCase();
    const pass = v('sPass');
    const cpass = v('sConfirm');
    const phone = v('sPhone');
    const agree = !!document.getElementById('sAgree')?.checked;

    let ok = true;

    if (name.length < 2) {
      err('eN', 'Name must be at least 2 characters');
      ok = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err('eE', 'Enter a valid email');
      ok = false;
    }

    if (pass.length < 6) {
      err('eP', 'Password must be at least 6 characters');
      ok = false;
    }

    if (pass !== cpass) {
      err('eC', 'Passwords do not match');
      ok = false;
    }

    if (!agree) {
      TOAST.show('Accept Terms & Privacy Policy', 'warn');
      ok = false;
    }

    if (!ok) return;

    const btn = form.querySelector('button[type="submit"]');
    const oldText = btn ? btn.textContent : '';

    setBtnState(btn, true, '⏳ Creating...');

    try {
      const d = await API.post('/auth/signup', {
        name,
        email,
        password: pass,
        phone,
        city: localStorage.getItem('mz_city') || 'Mumbai'
      });

      if (!d || !d.success) {
        err('eE', d?.message || 'Signup failed');
        return;
      }

      SESSION.set(d.user || null, d.token || null);
      TOAST.show(`Welcome, ${(d.user?.name || 'User').split(' ')[0]}! 🎬`, 'success');

      setTimeout(() => {
        location.href =
          new URLSearchParams(location.search).get('redirect') || 'index.html';
      }, 700);
    } catch (error) {
      const msg =
        error?.message ||
        'Cannot connect to server. Is backend running?';

      if (
        /email/i.test(msg) ||
        /exist/i.test(msg) ||
        /already/i.test(msg)
      ) {
        err('eE', msg);
      } else if (/password/i.test(msg)) {
        err('eP', msg);
      } else {
        TOAST.show(msg, 'error');
      }
    } finally {
      setBtnState(btn, false, oldText || 'Create Account');
    }
  });
}

function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  bindEyeToggles();

  const demoBtn = document.getElementById('demoBtn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      const emailEl = document.getElementById('lEmail');
      const passEl = document.getElementById('lPass');

      if (emailEl) emailEl.value = 'demo@BookMyShow.in';
      if (passEl) passEl.value = 'demo123';

      TOAST.show('Demo credentials filled! Click Sign In', 'info');
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErr();

    const email = v('lEmail').toLowerCase();
    const pass = v('lPass');

    let ok = true;

    if (!email) {
      err('lEE', 'Email is required');
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err('lEE', 'Enter a valid email');
      ok = false;
    }

    if (!pass) {
      err('lEP', 'Password is required');
      ok = false;
    }

    if (!ok) return;

    const btn = form.querySelector('button[type="submit"]');
    const oldText = btn ? btn.textContent : '';

    setBtnState(btn, true, '⏳ Signing in...');

    try {
      const d = await API.post('/auth/login', {
        email,
        password: pass
      });

      if (!d || !d.success) {
        err('lEP', d?.message || 'Login failed');
        return;
      }

      SESSION.set(d.user || null, d.token || null);
      TOAST.show(d.message || 'Welcome back! 🎬', 'success');

      setTimeout(() => {
        location.href = decodeURIComponent(
          new URLSearchParams(location.search).get('redirect') || 'index.html'
        );
      }, 600);
    } catch (error) {
      const msg =
        error?.message ||
        'Cannot connect to server. Run backend first.';

      if (
        /invalid/i.test(msg) ||
        /incorrect/i.test(msg) ||
        /password/i.test(msg) ||
        /credential/i.test(msg) ||
        /user/i.test(msg) ||
        /email/i.test(msg)
      ) {
        err('lEP', msg);
      } else {
        TOAST.show(msg, 'error');
      }
    } finally {
      setBtnState(btn, false, oldText || 'Sign In');
    }
  });
}

function bindEyeToggles() {
  document.querySelectorAll('[data-eye]').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;

    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.eye);
      if (!inp) return;

      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁️' : '🙈';
    });
  });
}

function setBtnState(btn, disabled, text) {
  if (!btn) return;
  btn.disabled = disabled;
  btn.textContent = text;
}

function v(id) {
  return (document.getElementById(id)?.value || '').trim();
}

function err(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
  }

  const inputMap = {
    eN: 'sName',
    eE: 'sEmail',
    eP: 'sPass',
    eC: 'sConfirm',
    lEE: 'lEmail',
    lEP: 'lPass'
  };

  const inputId = inputMap[id];
  const input = inputId ? document.getElementById(inputId) : null;
  if (input) {
    input.classList.add('err');
  }
}

function clearErr() {
  document.querySelectorAll('.fe').forEach((e) => {
    e.textContent = '';
    e.classList.remove('show');
  });

  document.querySelectorAll('.fi').forEach((e) => {
    e.classList.remove('err');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSignup();
  initLogin();
});