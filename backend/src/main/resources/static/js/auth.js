// Redirect if already logged in
if (getToken()) window.location.href = '/dashboard.html';

// Create floating particles
(function() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 6 + 2;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*10}s;opacity:${Math.random()*0.4+0.1}`;
    container.appendChild(p);
  }
})();

function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('login-form').style.display = isLogin ? '' : 'none';
  document.getElementById('signup-form').style.display = isLogin ? 'none' : '';
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-signup').classList.toggle('active', !isLogin);
  document.getElementById('auth-error').classList.remove('show');
}

function showError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.add('show');
}

async function doLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.textContent = 'Signing in…';
  document.getElementById('auth-error').classList.remove('show');
  try {
    const data = await POST('/auth/login', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    });
    saveAuth(data);
    window.location.href = '/dashboard.html';
  } catch(err) {
    showError(err.message || 'Invalid credentials');
    btn.disabled = false; btn.textContent = 'Sign In →';
  }
}

async function doSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  btn.disabled = true; btn.textContent = 'Creating account…';
  document.getElementById('auth-error').classList.remove('show');
  try {
    const data = await POST('/auth/signup', {
      name: document.getElementById('su-name').value,
      email: document.getElementById('su-email').value,
      password: document.getElementById('su-password').value,
      role: document.getElementById('su-role').value
    });
    saveAuth(data);
    window.location.href = '/dashboard.html';
  } catch(err) {
    showError(err.message || 'Signup failed');
    btn.disabled = false; btn.textContent = 'Create Account →';
  }
}
