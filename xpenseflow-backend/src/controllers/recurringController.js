const pool = require('../db/pool');

function row2tpl(r) {
    return {
        id:        r.id,
        name:      r.name,
        type:      r.type,
        amount:    parseFloat(r.amount),
        frequency: r.frequency,
        category:  r.category,
        nextDate:  r.next_date instanceof Date
                     ? r.next_date.toISOString().slice(0, 10)
                     : String(r.next_date).slice(0, 10),
    };
}

/* GET /api/recurring */
async function list(req, res) {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM recurring_templates WHERE user_id=$1 ORDER BY id',
            [req.user.id]
        );
        res.json({ templates: rows.map(row2tpl) });
    } catch (err) {
        console.error('[recurring.list]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* POST /api/recurring */
async function create(req, res) {
    try {
        const { name, type, amount, frequency, category, nextDate } = req.body;
        if (!name || !type || amount === undefined || !frequency || !nextDate) {
            return res.status(400).json({ error: 'name, type, amount, frequency and nextDate are required.' });
        }
        const { rows } = await pool.query(
            `INSERT INTO recurring_templates (user_id, name, type, amount, frequency, category, next_date)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [req.user.id, name, type, amount, frequency, category || 'Other', nextDate]
        );
        res.status(201).json({ template: row2tpl(rows[0]) });
    } catch (err) {
        console.error('[recurring.create]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* PATCH /api/recurring/:id */
async function update(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const { name, type, amount, frequency, category, nextDate } = req.body;

        const existing = await pool.query(
            'SELECT id FROM recurring_templates WHERE id=$1 AND user_id=$2',
            [id, req.user.id]
        );
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Template not found.' });

        const { rows } = await pool.query(
            `UPDATE recurring_templates
             SET name=$1, type=$2, amount=$3, frequency=$4, category=$5, next_date=$6
             WHERE id=$7 AND user_id=$8 RETURNING *`,
            [name, type, amount, frequency, category || 'Other', nextDate, id, req.user.id]
        );
        res.json({ template: row2tpl(rows[0]) });
    } catch (err) {
        console.error('[recurring.update]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* DELETE /api/recurring/:id */
async function remove(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const result = await pool.query(
            'DELETE FROM recurring_templates WHERE id=$1 AND user_id=$2',
            [id, req.user.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Template not found.' });
        res.json({ success: true });
    } catch (err) {
        console.error('[recurring.remove]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* PATCH /api/recurring/:id/next-date — called by frontend after processing */
async function updateNextDate(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const { nextDate } = req.body;
        if (!nextDate) return res.status(400).json({ error: 'nextDate required.' });

        const { rows } = await pool.query(
            `UPDATE recurring_templates SET next_date=$1 WHERE id=$2 AND user_id=$3 RETURNING *`,
            [nextDate, id, req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Template not found.' });
        res.json({ template: row2tpl(rows[0]) });
    } catch (err) {
        console.error('[recurring.updateNextDate]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

/* POST /api/recurring/bulk */
async function bulk(req, res) {
    try {
        const { templates } = req.body;
        if (!Array.isArray(templates) || templates.length === 0) return res.json({ inserted: 0 });

        const client = await pool.connect();
        const inserted = [];
        try {
            await client.query('BEGIN');
            for (const t of templates) {
                const { rows } = await client.query(
                    `INSERT INTO recurring_templates (user_id, name, type, amount, frequency, category, next_date)
                     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
                    [req.user.id, t.name, t.type, t.amount, t.frequency, t.category || 'Other', t.nextDate]
                );
                inserted.push(row2tpl(rows[0]));
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
        res.json({ templates: inserted });
    } catch (err) {
        console.error('[recurring.bulk]', err);
        res.status(500).json({ error: 'Server error.' });
    }
}

module.exports = { list, create, update, remove, updateNextDate, bulk };
