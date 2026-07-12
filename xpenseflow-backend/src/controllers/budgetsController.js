const pool = require('../db/pool');

function row2budget(r) {
    return {
        id:       r.id,
        category: r.category,
        limit:    parseFloat(r.limit),
        period:   r.period,
    };
}

/* GET /api/budgets */
async function list(req, res) {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM budgets WHERE user_id=$1 ORDER BY id',
            [req.user.id]
        );
        res.json({ budgets: rows.map(row2budget) });
    } catch (err) {
        console.error('[budgets.list]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* POST /api/budgets */
async function create(req, res) {
    try {
        const { category, limit, period } = req.body;
        if (!category || limit === undefined || !period) {
            return res.status(400).json({ error: 'category, limit and period are required.' });
        }
        const { rows } = await pool.query(
            `INSERT INTO budgets (user_id, category, "limit", period)
             VALUES ($1,$2,$3,$4) RETURNING *`,
            [req.user.id, category, limit, period]
        );
        res.status(201).json({ budget: row2budget(rows[0]) });
    } catch (err) {
        console.error('[budgets.create]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* PATCH /api/budgets/:id */
async function update(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const { category, limit, period } = req.body;

        const existing = await pool.query(
            'SELECT id FROM budgets WHERE id=$1 AND user_id=$2',
            [id, req.user.id]
        );
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Budget not found.' });

        const { rows } = await pool.query(
            `UPDATE budgets SET category=$1, "limit"=$2, period=$3
             WHERE id=$4 AND user_id=$5 RETURNING *`,
            [category, limit, period, id, req.user.id]
        );
        res.json({ budget: row2budget(rows[0]) });
    } catch (err) {
        console.error('[budgets.update]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* DELETE /api/budgets/:id */
async function remove(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const result = await pool.query(
            'DELETE FROM budgets WHERE id=$1 AND user_id=$2',
            [id, req.user.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Budget not found.' });
        res.json({ success: true });
    } catch (err) {
        console.error('[budgets.remove]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* POST /api/budgets/bulk */
async function bulk(req, res) {
    try {
        const { budgets } = req.body;
        if (!Array.isArray(budgets) || budgets.length === 0) return res.json({ inserted: 0 });

        const client = await pool.connect();
        const inserted = [];
        try {
            await client.query('BEGIN');
            for (const b of budgets) {
                const { rows } = await client.query(
                    `INSERT INTO budgets (user_id, category, "limit", period)
                     VALUES ($1,$2,$3,$4) RETURNING *`,
                    [req.user.id, b.category, b.limit, b.period]
                );
                inserted.push(row2budget(rows[0]));
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
        res.json({ budgets: inserted });
    } catch (err) {
        console.error('[budgets.bulk]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

module.exports = { list, create, update, remove, bulk };
