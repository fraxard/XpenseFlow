const pool = require('../db/pool');

/* GET /api/categories  →  { expense: [...], income: [...] } */
async function list(req, res) {
    try {
        const { rows } = await pool.query(
            'SELECT type, name FROM custom_categories WHERE user_id=$1 ORDER BY id',
            [req.user.id]
        );
        const out = { expense: [], income: [] };
        rows.forEach(r => out[r.type].push(r.name));
        res.json({ customCategories: out });
    } catch (err) {
        console.error('[categories.list]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* POST /api/categories  Body: { type, name } */
async function create(req, res) {
    try {
        const { type, name } = req.body;
        if (!type || !name) return res.status(400).json({ error: 'type and name required.' });
        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: 'type must be income or expense.' });
        }
        await pool.query(
            `INSERT INTO custom_categories (user_id, type, name) VALUES ($1,$2,$3)
             ON CONFLICT (user_id, type, name) DO NOTHING`,
            [req.user.id, type, name.trim()]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        console.error('[categories.create]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* DELETE /api/categories  Body: { type, name } */
async function remove(req, res) {
    try {
        const { type, name } = req.body;
        if (!type || !name) return res.status(400).json({ error: 'type and name required.' });
        await pool.query(
            'DELETE FROM custom_categories WHERE user_id=$1 AND type=$2 AND name=$3',
            [req.user.id, type, name]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[categories.remove]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* POST /api/categories/bulk  Body: { customCategories: { expense:[...], income:[...] } } */
async function bulk(req, res) {
    try {
        const { customCategories } = req.body;
        if (!customCategories) return res.json({ inserted: 0 });
        const client = await pool.connect();
        let inserted = 0;
        try {
            await client.query('BEGIN');
            for (const type of ['expense', 'income']) {
                for (const name of (customCategories[type] || [])) {
                    await client.query(
                        `INSERT INTO custom_categories (user_id, type, name) VALUES ($1,$2,$3)
                         ON CONFLICT DO NOTHING`,
                        [req.user.id, type, name]
                    );
                    inserted++;
                }
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
        console.error('[categories.bulk]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

module.exports = { list, create, remove, bulk };
