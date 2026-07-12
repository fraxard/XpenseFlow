const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Keep connections alive; sensible defaults for a local/single-server setup
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

// Crash loudly on unexpected pool errors so they don't silently swallow problems
pool.on('error', (err) => {
    console.error('[DB] Unexpected pool error:', err.message);
});

// Convenience wrapper: pool.query is already promise-based
module.exports = pool;
