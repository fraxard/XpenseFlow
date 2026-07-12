require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');

const app = express();
const PORT = process.env.PORT || 3001;

/* ── Middleware ── */
/* ── CORS: accept any origin on the same LAN ── */
const allowedOrigins = (
    process.env.CLIENT_ORIGINS ||
    'http://localhost:5500'
)
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true); // Postman / curl
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json({ limit: '8mb' }));


/* ── Health check ── */
// app.get('/api/health', async (_req, res) => {
//     try {
//         await pool.query('SELECT 1');
//         res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
//     } catch {
//         res.status(503).json({ status: 'error', db: 'disconnected' });
//     }
// });
app.get('/api/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'ok',
            db: 'connected',
            ts: new Date().toISOString()
        });
    } catch (err) {
        console.error("Database connection failed:");
        console.error(err);

        res.status(503).json({
            status: "error",
            db: "disconnected",
            message: err.message
        });
    }
});



/* ── Routes ── */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/recurring', require('./routes/recurring'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/categories', require('./routes/categories'));

/* ── 404 fallback ── */
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

/* ── Global error handler ── */
app.use((err, _req, res, _next) => {
    console.error('[Unhandled]', err);
    res.status(500).json({ error: 'Internal server error.' });
});

/* ── Start ── */
app.listen(PORT,'0.0.0.0', () => {
    console.log(`✅  XpenseFlow API running on http://localhost:${PORT}`);
    console.log(`    Health: http://localhost:${PORT}/api/health`);
});
