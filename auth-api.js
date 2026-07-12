/* ═══════════════════════════════════════════════════════════
   auth-api.js  —  XpenseFlow frontend auth client
═══════════════════════════════════════════════════════════ */

// NEW — auto-detects: if accessed via LAN IP, hits that same IP's backend:
const API_BASE = `http://${window.location.hostname}:3001/api`;

/* ── Token helpers ── */
function getToken()         { return localStorage.getItem('xf_token'); }
function setToken(t)        { localStorage.setItem('xf_token', t); }
function clearToken()       { localStorage.removeItem('xf_token'); }
function getAuthUser()      { return JSON.parse(localStorage.getItem('xf_user') || 'null'); }
function setAuthUser(u)     { localStorage.setItem('xf_user', JSON.stringify(u)); }
function clearAuthUser()    { localStorage.removeItem('xf_user'); }

/* ── Authenticated fetch wrapper ── */
async function apiFetch(path, options = {}) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
}

/* ── Auth actions ── */
async function authRegister(email, password, name) {
    const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
    });
    setToken(data.token);
    setAuthUser(data.user);
    return data.user;
}

async function authLogin(email, password) {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setAuthUser(data.user);
    return data.user;
}

async function authMe() {
    const data = await apiFetch('/auth/me');
    setAuthUser(data.user);
    return data.user;
}

function authLogout() {
    clearToken();
    clearAuthUser();
    renderAuthButton();
}

/* ════════════════════════════════════════════════════════
   AUTH BUTTON  (renders next to theme toggle)
════════════════════════════════════════════════════════ */
function renderAuthButton() {
    const container = document.getElementById('auth-btn-container');
    if (!container) return;

    const user = getAuthUser();

    if (user) {
        // Logged in → avatar with initial + dropdown
        const initial = (user.name || user.email)[0].toUpperCase();
        container.innerHTML = `
            <div class="auth-avatar-wrap" id="auth-avatar-wrap">
                <button class="auth-avatar-btn" id="auth-avatar-btn" title="${user.name} (${user.email})">
                    ${initial}
                </button>
                <div class="auth-dropdown" id="auth-dropdown">
                    <div class="auth-dropdown-user">
                        <span class="auth-dropdown-name">${user.name}</span>
                        <span class="auth-dropdown-email">${user.email}</span>
                    </div>
                    <div class="auth-dropdown-divider"></div>
                    <button class="auth-dropdown-item auth-logout-btn" id="auth-logout-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign out
                    </button>
                </div>
            </div>
        `;

        document.getElementById('auth-avatar-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('auth-dropdown').classList.toggle('is-open');
        });
        document.getElementById('auth-logout-btn').addEventListener('click', () => {
            authLogout();
        });
        document.addEventListener('click', (e) => {
            const wrap = document.getElementById('auth-avatar-wrap');
            if (wrap && !wrap.contains(e.target)) {
                document.getElementById('auth-dropdown')?.classList.remove('is-open');
            }
        }, { once: false });

    } else {
        // Logged out → "Sign in" button
        container.innerHTML = `
            <button class="auth-signin-btn" id="auth-signin-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Sign in
            </button>
        `;
        document.getElementById('auth-signin-btn').addEventListener('click', openAuthModal);
    }
}

/* ════════════════════════════════════════════════════════
   AUTH MODAL  (login / register)
════════════════════════════════════════════════════════ */
function buildAuthModal() {
    if (document.getElementById('auth-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'auth-modal-overlay';
    overlay.className = 'auth-modal-overlay';
    overlay.innerHTML = `
        <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">

            <!-- Tab bar -->
            <div class="auth-tabs">
                <button class="auth-tab is-active" data-tab="login">Sign in</button>
                <button class="auth-tab" data-tab="register">Create account</button>
            </div>

            <!-- LOGIN panel -->
            <div class="auth-panel" id="auth-panel-login">
                <div class="form-control">
                    <label for="auth-login-email">Email</label>
                    <input type="text" id="auth-login-email" placeholder="you@example.com" autocomplete="email">
                    <span class="error-message" id="auth-login-email-err"></span>
                </div>
                <div class="form-control">
                    <label for="auth-login-password">Password</label>
                    <input type="password" id="auth-login-password" placeholder="••••••••" autocomplete="current-password">
                    <span class="error-message" id="auth-login-password-err"></span>
                </div>
                <div class="error-message auth-global-err" id="auth-login-global-err"></div>
                <button class="btn auth-submit-btn" id="auth-login-btn">Sign in</button>
            </div>

            <!-- REGISTER panel -->
            <div class="auth-panel" id="auth-panel-register" style="display:none">
                <div class="form-control">
                    <label for="auth-reg-name">Full name</label>
                    <input type="text" id="auth-reg-name" placeholder="Jane Smith" autocomplete="name">
                    <span class="error-message" id="auth-reg-name-err"></span>
                </div>
                <div class="form-control">
                    <label for="auth-reg-email">Email</label>
                    <input type="text" id="auth-reg-email" placeholder="you@example.com" autocomplete="email">
                    <span class="error-message" id="auth-reg-email-err"></span>
                </div>
                <div class="form-control">
                    <label for="auth-reg-password">Password <span style="font-weight:400;color:var(--color-text-faint)">(min 8 chars)</span></label>
                    <input type="password" id="auth-reg-password" placeholder="••••••••" autocomplete="new-password">
                    <span class="error-message" id="auth-reg-password-err"></span>
                </div>
                <div class="error-message auth-global-err" id="auth-reg-global-err"></div>
                <button class="btn auth-submit-btn" id="auth-register-btn">Create account</button>
            </div>

            <!-- Close -->
            <button class="auth-modal-close" id="auth-modal-close" aria-label="Close">&times;</button>
        </div>
    `;

    document.body.appendChild(overlay);

    /* Tab switching */
    overlay.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            overlay.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');
            const which = tab.dataset.tab;
            document.getElementById('auth-panel-login').style.display    = which === 'login'    ? '' : 'none';
            document.getElementById('auth-panel-register').style.display = which === 'register' ? '' : 'none';
            clearAuthModalErrors();
        });
    });

    /* Close */
    overlay.addEventListener('click', e => { if (e.target === overlay) closeAuthModal(); });
    document.getElementById('auth-modal-close').addEventListener('click', closeAuthModal);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeAuthModal();
    });

    /* Clear errors on input */
    ['auth-login-email','auth-login-password','auth-reg-name','auth-reg-email','auth-reg-password']
        .forEach(id => document.getElementById(id)?.addEventListener('input', clearAuthModalErrors));

    /* LOGIN submit */
    document.getElementById('auth-login-btn').addEventListener('click', async () => {
        clearAuthModalErrors();
        const email    = document.getElementById('auth-login-email').value.trim();
        const password = document.getElementById('auth-login-password').value;
        let valid = true;

        if (!email) { showFieldErr('auth-login-email', 'auth-login-email-err', 'Enter your email'); valid = false; }
        if (!password) { showFieldErr('auth-login-password', 'auth-login-password-err', 'Enter your password'); valid = false; }
        if (!valid) return;

        const btn = document.getElementById('auth-login-btn');
        setAuthBtnLoading(btn, true, 'Signing in…');
        try {
            const user = await authLogin(email, password);
            closeAuthModal();
            renderAuthButton();
            showAuthToast(`Welcome back, ${user.name}!`);
        } catch (err) {
            document.getElementById('auth-login-global-err').textContent = err.message;
        } finally {
            setAuthBtnLoading(btn, false, 'Sign in');
        }
    });

    /* REGISTER submit */
    document.getElementById('auth-register-btn').addEventListener('click', async () => {
        clearAuthModalErrors();
        const name     = document.getElementById('auth-reg-name').value.trim();
        const email    = document.getElementById('auth-reg-email').value.trim();
        const password = document.getElementById('auth-reg-password').value;
        let valid = true;

        if (name.length < 2)  { showFieldErr('auth-reg-name',     'auth-reg-name-err',     'Enter your name (min 2 chars)'); valid = false; }
        if (!email)            { showFieldErr('auth-reg-email',    'auth-reg-email-err',    'Enter your email'); valid = false; }
        if (password.length < 8) { showFieldErr('auth-reg-password', 'auth-reg-password-err', 'Password must be at least 8 characters'); valid = false; }
        if (!valid) return;

        const btn = document.getElementById('auth-register-btn');
        setAuthBtnLoading(btn, true, 'Creating account…');
        try {
            const user = await authRegister(email, password, name);
            closeAuthModal();
            renderAuthButton();
            showAuthToast(`Account created! Welcome, ${user.name} 🎉`);
        } catch (err) {
            document.getElementById('auth-reg-global-err').textContent = err.message;
        } finally {
            setAuthBtnLoading(btn, false, 'Create account');
        }
    });

    /* Enter key on last field triggers submit */
    document.getElementById('auth-login-password').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('auth-login-btn').click();
    });
    document.getElementById('auth-reg-password').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('auth-register-btn').click();
    });
}

function openAuthModal(startTab = 'login') {
    buildAuthModal();
    clearAuthModalErrors();
    // Switch to the right tab
    document.querySelectorAll('.auth-tab').forEach(t => {
        const active = t.dataset.tab === startTab;
        t.classList.toggle('is-active', active);
    });
    document.getElementById('auth-panel-login').style.display    = startTab === 'login'    ? '' : 'none';
    document.getElementById('auth-panel-register').style.display = startTab === 'register' ? '' : 'none';

    document.getElementById('auth-modal-overlay').classList.add('is-open');
    // Focus first input
    setTimeout(() => {
        const first = document.getElementById(startTab === 'login' ? 'auth-login-email' : 'auth-reg-name');
        first?.focus();
    }, 50);
}

function closeAuthModal() {
    document.getElementById('auth-modal-overlay')?.classList.remove('is-open');
}

/* ── Small helpers ── */
function showFieldErr(inputId, errId, msg) {
    document.getElementById(inputId)?.classList.add('invalid');
    const el = document.getElementById(errId);
    if (el) el.textContent = msg;
}

function clearAuthModalErrors() {
    ['auth-login-email','auth-login-password','auth-reg-name','auth-reg-email','auth-reg-password']
        .forEach(id => document.getElementById(id)?.classList.remove('invalid'));
    ['auth-login-email-err','auth-login-password-err','auth-reg-name-err',
     'auth-reg-email-err','auth-reg-password-err','auth-login-global-err','auth-reg-global-err']
        .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
}

function setAuthBtnLoading(btn, loading, label) {
    btn.disabled = loading;
    btn.textContent = label;
    btn.style.opacity = loading ? '0.7' : '1';
}

/* ── Toast notification ── */
function showAuthToast(message) {
    let toast = document.getElementById('auth-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'auth-toast';
        toast.style.cssText = `
            position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);
            background:var(--color-surface);border:1px solid var(--color-border);
            border-radius:var(--radius-md);padding:12px 20px;font-size:14px;font-weight:600;
            color:var(--color-text);box-shadow:var(--shadow-hero);z-index:9999;
            opacity:0;transition:opacity 0.25s ease,transform 0.25s ease;white-space:nowrap;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3500);
}

/* ════════════════════════════════════════════════════════
   BOOT  —  runs on every page load
════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
    renderAuthButton();

    // Silently re-validate the stored token on load
    const token = getToken();
    if (token) {
        try {
            await authMe();       // refreshes user data from server
            renderAuthButton();   // re-render with fresh name/email
        } catch {
            // Token expired / invalid — clear it
            clearToken();
            clearAuthUser();
            renderAuthButton();
        }
    }
});
