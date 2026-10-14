(function () {
  let mode = 'signin'; // 'signin' | 'signup'

  // already signed in? go straight to the app
  if (localStorage.getItem('bc_token')) {
    fetch('/api/me', { headers: { Authorization: 'Bearer ' + localStorage.getItem('bc_token') } })
      .then((r) => { if (r.ok) location.href = '/app.html'; else localStorage.removeItem('bc_token'); })
      .catch(() => {});
  }

  const $ = (id) => document.getElementById(id);
  const errorBox = $('authError');

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
  }
  function clearError() { errorBox.classList.add('hidden'); }

  function setMode(m) {
    mode = m;
    clearError();
    const up = m === 'signup';
    $('authTitle').textContent = up ? 'Create your account' : 'Welcome back';
    $('authSubtitle').textContent = up ? 'Start building your brand in minutes.' : 'Sign in to build your brand identity.';
    $('nameField').classList.toggle('hidden', !up);
    $('submitBtn').textContent = up ? 'Create account' : 'Sign in';
    $('switchText').textContent = up ? 'Already have an account?' : 'New to BrandCraft?';
    $('switchBtn').textContent = up ? 'Sign in' : 'Create account';
    $('password').autocomplete = up ? 'new-password' : 'current-password';
  }
  $('switchBtn').addEventListener('click', () => setMode(mode === 'signin' ? 'signup' : 'signin'));

  function finish(data) {
    localStorage.setItem('bc_token', data.token);
    localStorage.setItem('bc_user', JSON.stringify(data.user));
    location.href = '/app.html';
  }

  async function post(url, body) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  $('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const email = $('email').value.trim();
    const password = $('password').value;
    const name = $('name').value.trim();
    if (mode === 'signup' && !name) return showError('Please enter your name.');
    if (!email) return showError('Please enter your email.');
    if (!password) return showError('Please enter your password.');
    const btn = $('submitBtn');
    btn.disabled = true;
    try {
      const data = mode === 'signup'
        ? await post('/api/auth/signup', { name, email, password })
        : await post('/api/auth/login', { email, password });
      finish(data);
    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
    }
  });

  // ---------- Google sign-in ----------
  async function handleGoogle(response) {
    clearError();
    try { finish(await post('/api/auth/google', { credential: response.credential })); }
    catch (err) { showError(err.message); }
  }

  fetch('/api/config')
    .then((r) => r.json())
    .then((cfg) => {
      if (cfg.googleClientId) {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.onload = () => {
          window.google.accounts.id.initialize({ client_id: cfg.googleClientId, callback: handleGoogle });
          window.google.accounts.id.renderButton($('googleBtn'), { theme: 'outline', size: 'large', width: 346, text: 'continue_with' });
        };
        document.head.appendChild(s);
      } else {
        // Not configured: keep the button visible but explain what to do when clicked.
        const fb = $('googleFallback');
        fb.classList.remove('hidden');
        fb.addEventListener('click', () =>
          showError('Google sign-in is not set up yet. Add GOOGLE_CLIENT_ID to your .env file (see README), or use email and password.')
        );
      }
    })
    .catch(() => {});
})();
