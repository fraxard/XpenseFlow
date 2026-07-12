/* ═══════════════════════════════════════════════════════════
   db-api.js  —  XpenseFlow unified data layer
   -------------------------------------------------------
   When a user is logged in  →  all reads/writes go to the API.
   When guest (no token)     →  falls back to localStorage.

   This file must be loaded AFTER auth-api.js and BEFORE script.js.

   Public surface (mirrors what script.js already uses):
     DB.transactions.getAll()
     DB.transactions.save(tx)          // create or update depending on tx.id
     DB.transactions.delete(id)
     DB.transactions.setAll(arr)       // used by processRecurring to batch-save inserts

     DB.recurring.getAll()
     DB.recurring.save(tpl)
     DB.recurring.delete(id)
     DB.recurring.updateNextDate(id, dateStr)

     DB.budgets.getAll()
     DB.budgets.save(b)
     DB.budgets.delete(id)

     DB.categories.get()              // → { expense:[], income:[] }
     DB.categories.add(type, name)
     DB.categories.remove(type, name)

     DB.importFromLocalStorage()      // call once on login to push guest data to server
     DB.loadAll()                     // fetch everything from server, hydrate localStorage cache
═══════════════════════════════════════════════════════════ */

const DB_API_BASE = 'http://localhost:3001/api';

/* ── tiny fetch wrapper (re-uses auth token from auth-api.js) ── */
async function _fetch(path, options = {}) {
    const token = localStorage.getItem('xf_token');
    const res = await fetch(`${DB_API_BASE}${path}`, {
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

function _isLoggedIn() {
    return Boolean(localStorage.getItem('xf_token'));
}

/* ══════════════════════════════════════════════════════════
   TRANSACTIONS
══════════════════════════════════════════════════════════ */
const _tx = {
    async getAll() {
        if (!_isLoggedIn()) {
            return JSON.parse(localStorage.getItem('transactions')) || [];
        }
        const { transactions } = await _fetch('/transactions');
        // keep localStorage in sync as a local cache
        localStorage.setItem('transactions', JSON.stringify(transactions));
        return transactions;
    },

    async save(tx) {
        if (!_isLoggedIn()) {
            // localStorage path (unchanged from original script.js)
            return;   // script.js still writes to localStorage directly in guest mode
        }
        if (tx.id && typeof tx.id === 'number' && tx.id > 1_000_000) {
            // Looks like a locally-generated Math.random ID — treat as create
            const { transaction } = await _fetch('/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    text:        tx.text,
                    amount:      tx.amount,
                    category:    tx.category,
                    date:        tx.date,
                    receipt:     tx.receipt || null,
                    recurringId: tx.recurringId || null,
                }),
            });
            return transaction;
        }
        if (tx.id) {
            const { transaction } = await _fetch(`/transactions/${tx.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    text:     tx.text,
                    amount:   tx.amount,
                    category: tx.category,
                    date:     tx.date,
                    receipt:  tx.receipt ?? null,
                }),
            });
            return transaction;
        }
        // No id → create
        const { transaction } = await _fetch('/transactions', {
            method: 'POST',
            body: JSON.stringify({
                text:        tx.text,
                amount:      tx.amount,
                category:    tx.category,
                date:        tx.date,
                receipt:     tx.receipt || null,
                recurringId: tx.recurringId || null,
            }),
        });
        return transaction;
    },

    async delete(id) {
        if (!_isLoggedIn()) return;
        await _fetch(`/transactions/${id}`, { method: 'DELETE' });
    },

    async bulkCreate(txns) {
        if (!_isLoggedIn() || txns.length === 0) return;
        await _fetch('/transactions/bulk', {
            method: 'POST',
            body: JSON.stringify({ transactions: txns }),
        });
    },
};

/* ══════════════════════════════════════════════════════════
   RECURRING TEMPLATES
══════════════════════════════════════════════════════════ */
const _recurring = {
    async getAll() {
        if (!_isLoggedIn()) {
            return JSON.parse(localStorage.getItem('recurringTemplates')) || [];
        }
        const { templates } = await _fetch('/recurring');
        localStorage.setItem('recurringTemplates', JSON.stringify(templates));
        return templates;
    },

    async save(tpl) {
        if (!_isLoggedIn()) return tpl;
        const payload = {
            name:      tpl.name,
            type:      tpl.type,
            amount:    tpl.amount,
            frequency: tpl.frequency,
            category:  tpl.category,
            nextDate:  tpl.nextDate,
        };
        if (tpl._isNew || !tpl.id) {
            const { template } = await _fetch('/recurring', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            return template;
        }
        const { template } = await _fetch(`/recurring/${tpl.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        return template;
    },

    async delete(id) {
        if (!_isLoggedIn()) return;
        await _fetch(`/recurring/${id}`, { method: 'DELETE' });
    },

    async updateNextDate(id, nextDate) {
        if (!_isLoggedIn()) return;
        await _fetch(`/recurring/${id}/next-date`, {
            method: 'PATCH',
            body: JSON.stringify({ nextDate }),
        });
    },

    async bulkCreate(templates) {
        if (!_isLoggedIn() || templates.length === 0) return [];
        const { templates: saved } = await _fetch('/recurring/bulk', {
            method: 'POST',
            body: JSON.stringify({ templates }),
        });
        return saved || [];
    },
};

/* ══════════════════════════════════════════════════════════
   BUDGETS
══════════════════════════════════════════════════════════ */
const _budgets = {
    async getAll() {
        if (!_isLoggedIn()) {
            return JSON.parse(localStorage.getItem('budgets')) || [];
        }
        const { budgets } = await _fetch('/budgets');
        localStorage.setItem('budgets', JSON.stringify(budgets));
        return budgets;
    },

    async save(b) {
        if (!_isLoggedIn()) return b;
        const payload = { category: b.category, limit: b.limit, period: b.period };
        if (b._isNew || !b.id) {
            const { budget } = await _fetch('/budgets', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            return budget;
        }
        const { budget } = await _fetch(`/budgets/${b.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        return budget;
    },

    async delete(id) {
        if (!_isLoggedIn()) return;
        await _fetch(`/budgets/${id}`, { method: 'DELETE' });
    },

    async bulkCreate(budgets) {
        if (!_isLoggedIn() || budgets.length === 0) return [];
        const { budgets: saved } = await _fetch('/budgets/bulk', {
            method: 'POST',
            body: JSON.stringify({ budgets }),
        });
        return saved || [];
    },
};

/* ══════════════════════════════════════════════════════════
   CUSTOM CATEGORIES
══════════════════════════════════════════════════════════ */
const _categories = {
    async get() {
        if (!_isLoggedIn()) {
            return JSON.parse(localStorage.getItem('customCategories')) || { expense: [], income: [] };
        }
        const { customCategories } = await _fetch('/categories');
        localStorage.setItem('customCategories', JSON.stringify(customCategories));
        return customCategories;
    },

    async add(type, name) {
        if (!_isLoggedIn()) return;
        await _fetch('/categories', {
            method: 'POST',
            body: JSON.stringify({ type, name }),
        });
    },

    async remove(type, name) {
        if (!_isLoggedIn()) return;
        await _fetch('/categories', {
            method: 'DELETE',
            body: JSON.stringify({ type, name }),
        });
    },

    async bulkCreate(customCategories) {
        if (!_isLoggedIn()) return;
        await _fetch('/categories/bulk', {
            method: 'POST',
            body: JSON.stringify({ customCategories }),
        });
    },
};

/* ══════════════════════════════════════════════════════════
   IMPORT (guest localStorage → server on first login)
══════════════════════════════════════════════════════════ */
async function _importFromLocalStorage() {
    if (!_isLoggedIn()) return;

    // Check flag so we only do this once per login session
    if (sessionStorage.getItem('xf_imported')) return;
    sessionStorage.setItem('xf_imported', '1');

    try {
        // Check if the user already has server data (returning user)
        const { transactions: existing } = await _fetch('/transactions');
        if (existing.length > 0) {
            // Returning user — load from server, discard guest data
            await _loadAll();
            return;
        }

        // First-time login with guest data → push everything
        const guestTx      = JSON.parse(localStorage.getItem('transactions'))        || [];
        const guestRec     = JSON.parse(localStorage.getItem('recurringTemplates'))  || [];
        const guestBudgets = JSON.parse(localStorage.getItem('budgets'))             || [];
        const guestCats    = JSON.parse(localStorage.getItem('customCategories'))    || { expense: [], income: [] };

        const hasMeaningfulData = guestTx.some(t => !t.id || t.id > 4); // skip the 4 demo transactions
        if (hasMeaningfulData) {
            const nonDemo = guestTx.filter(t => !t.id || t.id > 4);
            await Promise.all([
                _tx.bulkCreate(nonDemo),
                _recurring.bulkCreate(guestRec),
                _budgets.bulkCreate(guestBudgets),
                _categories.bulkCreate(guestCats),
            ]);
        }

        await _loadAll();
    } catch (err) {
        console.warn('[db-api] import failed silently:', err.message);
    }
}

/* ══════════════════════════════════════════════════════════
   LOAD ALL  (refresh localStorage cache from server)
══════════════════════════════════════════════════════════ */
async function _loadAll() {
    if (!_isLoggedIn()) return;
    try {
        const [txData, recData, budData, catData] = await Promise.all([
            _fetch('/transactions'),
            _fetch('/recurring'),
            _fetch('/budgets'),
            _fetch('/categories'),
        ]);
        localStorage.setItem('transactions',        JSON.stringify(txData.transactions));
        localStorage.setItem('recurringTemplates',  JSON.stringify(recData.templates));
        localStorage.setItem('budgets',             JSON.stringify(budData.budgets));
        localStorage.setItem('customCategories',    JSON.stringify(catData.customCategories));
    } catch (err) {
        console.warn('[db-api] loadAll failed — working from cache:', err.message);
    }
}

/* ══════════════════════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════════════════════ */
window.DB = {
    transactions: _tx,
    recurring:    _recurring,
    budgets:      _budgets,
    categories:   _categories,
    importFromLocalStorage: _importFromLocalStorage,
    loadAll: _loadAll,
    isLoggedIn: _isLoggedIn,
};
