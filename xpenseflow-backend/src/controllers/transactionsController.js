const pool = require('../db/pool');

/* ── helpers ── */
function row2tx(r) {
    return {
        id:          r.id,
        text:        r.text,
        amount:      parseFloat(r.amount),
        category:    r.category,
        date:        r.date instanceof Date
                        ? r.date.toISOString().slice(0, 10)
                        : String(r.date).slice(0, 10),
        receipt:     r.receipt || null,
        recurringId: r.recurring_id || null,
    };
}

/* ────────────────────────────────
   GET /api/transactions
   Returns all transactions for the authenticated user, newest first.
──────────────────────────────── */
async function list(req, res) {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, id DESC',
            [req.user.id]
        );
        res.json({ transactions: rows.map(row2tx) });
    } catch (err) {
        console.error('[transactions.list]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* ────────────────────────────────
   POST /api/transactions
   Body: { text, amount, category, date, receipt?, recurringId? }
──────────────────────────────── */
async function create(req, res) {
    try {
        const { text, amount, category, date, receipt, recurringId } = req.body;
        if (!text || amount === undefined || !date) {
            return res.status(400).json({ error: 'text, amount and date are required.' });
        }
        const { rows } = await pool.query(
            `INSERT INTO transactions (user_id, text, amount, category, date, receipt, recurring_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [req.user.id, text, amount, category || 'Other', date, receipt || null, recurringId || null]
        );
        res.status(201).json({ transaction: row2tx(rows[0]) });
    } catch (err) {
        console.error('[transactions.create]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* ────────────────────────────────
   PATCH /api/transactions/:id
──────────────────────────────── */
async function update(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const { text, amount, category, date, receipt } = req.body;

        // Ownership check
        const existing = await pool.query(
            'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }

        const { rows } = await pool.query(
            `UPDATE transactions
             SET text=$1, amount=$2, category=$3, date=$4, receipt=$5
             WHERE id=$6 AND user_id=$7 RETURNING *`,
            [text, amount, category || 'Other', date, receipt ?? null, id, req.user.id]
        );
        res.json({ transaction: row2tx(rows[0]) });
    } catch (err) {
        console.error('[transactions.update]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* ────────────────────────────────
   DELETE /api/transactions/:id
──────────────────────────────── */
async function remove(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const result = await pool.query(
            'DELETE FROM transactions WHERE id=$1 AND user_id=$2',
            [id, req.user.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('[transactions.remove]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* ────────────────────────────────
   POST /api/transactions/bulk
   Body: { transactions: [...] }
   Used for importing localStorage data on first login.
──────────────────────────────── */
async function bulk(req, res) {
    try {
        const { transactions: txns } = req.body;
        if (!Array.isArray(txns) || txns.length === 0) {
            return res.json({ inserted: 0 });
        }

        const client = await pool.connect();
        let inserted = 0;
        try {
            await client.query('BEGIN');
            for (const t of txns) {
                if (!t.text || t.amount === undefined || !t.date) continue;
                await client.query(
                    `INSERT INTO transactions (user_id, text, amount, category, date, receipt)
                     VALUES ($1,$2,$3,$4,$5,$6)
                     ON CONFLICT DO NOTHING`,
                    [req.user.id, t.text, t.amount, t.category || 'Other', t.date, t.receipt || null]
                );
                inserted++;
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
        res.json({ inserted });
    } catch (err) {
        console.error('[transactions.bulk]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

module.exports = { list, create, update, remove, bulk };
