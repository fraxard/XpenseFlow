/* ═══════════════════════════════════════════════════════════
   db-api.js  —  XpenseFlow local-first data layer
   -------------------------------------------------------
   All data lives in localStorage, namespaced per user.

   Guest keys:      "transactions", "recurringTemplates", etc.
   Logged-in keys:  "transactions_42", "recurringTemplates_42", etc.

   The namespace shim at the top of script.js intercepts
   localStorage reads/writes automatically once the user object
   is in localStorage. This file only needs to handle the
   one-time migration on first login.
═══════════════════════════════════════════════════════════ */

/* ── Raw localStorage access (bypasses the shim in script.js) ── */
// We cache the originals NOW, before script.js installs the shim.
const _rawGet    = localStorage.getItem.bind(localStorage);
const _rawSet    = localStorage.setItem.bind(localStorage);
const _rawRemove = localStorage.removeItem.bind(localStorage);

function _uid() {
    const user = JSON.parse(_rawGet('xf_user') || 'null');
    return user ? String(user.id) : null;
}

/* ── On login: migrate guest data into the user-namespaced keys ── */
async function _loadAll() {
    const uid = _uid();
    if (!uid) return; // guest — nothing to do

    // Check if this user already has data on this machine
    const existing = _rawGet(`transactions_${uid}`);
    if (existing !== null) return; // returning user — keep their existing data

    // First login on this machine: migrate any guest data
    const DATA_KEYS = ['transactions', 'recurringTemplates', 'budgets', 'customCategories'];
    DATA_KEYS.forEach(base => {
        const guestVal = _rawGet(base);
        if (guestVal !== null) {
            _rawSet(`${base}_${uid}`, guestVal);
            _rawRemove(base); // clear guest key
        }
    });
}

/* ══════════════════════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════════════════════ */
window.DB = {
    isLoggedIn() {
        return Boolean(_rawGet('xf_token'));
    },
    userId: _uid,
    loadAll: _loadAll,
};