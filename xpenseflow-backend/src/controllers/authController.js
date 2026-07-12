const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../db/pool');

const SALT_ROUNDS = 12;

/* ── Helper: sign a JWT for a user row ── */
function signToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

/* ── Helper: safe user object (never expose the hash) ── */
function safeUser(user) {
    return { id: user.id, email: user.email, name: user.name, createdAt: user.created_at };
}

/* ════════════════════════════════════════
   POST /api/auth/register
   Body: { email, password, name }
════════════════════════════════════════ */
async function register(req, res) {
    try {
        const { email, password, name } = req.body;

        // ── Validation ──
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'email, password and name are required.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email address.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }
        if (name.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters.' });
        }

        // ── Check duplicate ──
        const exists = await pool.query(
            'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );
        if (exists.rows.length > 0) {
            return res.status(409).json({ error: 'An account with that email already exists.' });
        }

        // ── Hash & insert ──
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await pool.query(
            'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING *',
            [email.toLowerCase(), name.trim(), hash]
        );
        const user = result.rows[0];

        const token = signToken(user);
        return res.status(201).json({ token, user: safeUser(user) });

    } catch (err) {
        console.error('[register]', err);
        return res.status(500).json({ error: 'Server error. Please try again.' });
    }
}

/* ════════════════════════════════════════
   POST /api/auth/login
   Body: { email, password }
════════════════════════════════════════ */
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required.' });
        }

        // ── Look up user ──
        const result = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );
        const user = result.rows[0];

        // Timing-safe: always run bcrypt even if user not found
        const dummyHash = '$2b$12$invalidhashfortimingprotection000000000000000000000000';
        const match = await bcrypt.compare(password, user ? user.password : dummyHash);

        if (!user || !match) {
            return res.status(401).json({ error: 'Incorrect email or password.' });
        }

        const token = signToken(user);
        return res.status(200).json({ token, user: safeUser(user) });

    } catch (err) {
        console.error('[login]', err);
        return res.status(500).json({ error: 'Server error. Please try again.' });
    }
}

/* ════════════════════════════════════════
   GET /api/auth/me
   Header: Authorization: Bearer <token>
════════════════════════════════════════ */
async function me(req, res) {
    try {
        // req.user is set by requireAuth middleware
        const result = await pool.query(
            'SELECT id, email, name, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        const user = result.rows[0];
        if (!user) return res.status(404).json({ error: 'User not found.' });
        return res.status(200).json({ user: safeUser(user) });
    } catch (err) {
        console.error('[me]', err);
        return res.status(500).json({ error: 'Server error.' });
    }
}

/* ════════════════════════════════════════
   PATCH /api/auth/me
   Header: Authorization: Bearer <token>
   Body:   { name?, currentPassword?, newPassword? }
════════════════════════════════════════ */
async function updateMe(req, res) {
    try {
        const { name, currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];
        if (!user) return res.status(404).json({ error: 'User not found.' });

        let newHash = user.password;

        // If they want to change password, verify current one first
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'currentPassword is required to set a new password.' });
            }
            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) {
                return res.status(401).json({ error: 'Current password is incorrect.' });
            }
            if (newPassword.length < 8) {
                return res.status(400).json({ error: 'New password must be at least 8 characters.' });
            }
            newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        }

        const newName = name ? name.trim() : user.name;
        const updated = await pool.query(
            'UPDATE users SET name = $1, password = $2 WHERE id = $3 RETURNING *',
            [newName, newHash, userId]
        );

        return res.status(200).json({ user: safeUser(updated.rows[0]) });
    } catch (err) {
        console.error('[updateMe]', err);
        return res.status(500).json({ error: 'Server error.' });
    }
}

module.exports = { register, login, me, updateMe };
