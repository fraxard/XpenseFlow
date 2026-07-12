# XpenseFlow Backend — Setup & Integration Guide

## What's in this package

```
xpenseflow-backend/
├── src/
│   ├── index.js                   ← Express app entry point
│   ├── db/
│   │   ├── pool.js                ← PostgreSQL connection pool
│   │   └── schema.sql             ← Run once to create tables
│   ├── middleware/
│   │   └── auth.js                ← JWT requireAuth middleware
│   ├── controllers/
│   │   └── authController.js      ← register / login / me / updateMe
│   └── routes/
│       └── auth.js                ← /api/auth/* router
├── frontend/
│   ├── auth-api.js                ← Drop into your project root
│   └── auth-styles.css            ← Append to style.css
├── .env.example                   ← Copy → .env, fill in values
├── .gitignore
└── package.json
```

---

## Step 1 — Install PostgreSQL

### macOS (Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Windows
Download the installer from https://www.postgresql.org/download/windows/
- Default port: 5432
- Remember the password you set for the `postgres` user

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## Step 2 — Create the database

```bash
# Open the psql shell (use your OS username on Mac/Linux, 'postgres' on Windows)
psql -U postgres

# Inside psql:
CREATE DATABASE xpenseflow;
\q
```

---

## Step 3 — Run the schema

```bash
# From the xpenseflow-backend directory:
psql -U postgres -d xpenseflow -f src/db/schema.sql
```

You should see:
```
CREATE TABLE
CREATE INDEX
CREATE FUNCTION
CREATE TRIGGER
```

---

## Step 4 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
PORT=3001
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/xpenseflow
JWT_SECRET=<generate with the command below>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5500
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> **CLIENT_ORIGIN** — this must match where you serve the frontend.
> - VS Code Live Server default: `http://127.0.0.1:5500`
> - Python http.server:          `http://localhost:8000`
> - Direct file open won't work (CORS needs http). Use Live Server.

---

## Step 5 — Start the backend

```bash
# Development (auto-restarts on file changes):
npm run dev

# Production:
npm start
```

You should see:
console.log(process.env.DATABASE_URL);
```
✅  XpenseFlow API running on http://localhost:3001
    Health: http://localhost:3001/api/health
```

Test it: http://localhost:3001/api/health → `{"status":"ok","db":"connected"}`

---

## Step 6 — Integrate auth into your frontend

### 6a. Copy files

```
frontend/auth-api.js       →  (your project root, alongside script.js)
frontend/auth-styles.css   →  (contents appended to style.css)
```

### 6b. Append auth-styles.css to style.css

```bash
cat frontend/auth-styles.css >> ../style.css
```

Or open `auth-styles.css`, copy everything, paste at the bottom of `style.css`.

### 6c. Update index.html

**Add the auth container** inside `.header-actions`, just before the theme toggle:

```html
<div class="header-actions">
    <!-- ADD THIS: -->
    <div id="auth-btn-container"></div>

    <!-- existing theme toggle stays here -->
    <button id="theme-toggle" class="theme-toggle" ...>
```

**Add the script tag** just before `script.js`:

```html
<!-- ADD THIS before script.js: -->
<script src="auth-api.js"></script>
<script src="script.js"></script>
```

### 6d. Update reports.html

Same two changes:

```html
<!-- In header-actions, before theme toggle: -->
<div id="auth-btn-container"></div>

<!-- Before reports.js script tag: -->
<script src="auth-api.js"></script>
<script src="reports.js"></script>
```

---

## API Reference

### POST /api/auth/register
```json
Body:     { "email": "...", "password": "...", "name": "..." }
Response: { "token": "...", "user": { "id", "email", "name", "createdAt" } }
```

### POST /api/auth/login
```json
Body:     { "email": "...", "password": "..." }
Response: { "token": "...", "user": { "id", "email", "name", "createdAt" } }
```

### GET /api/auth/me
```
Header:   Authorization: Bearer <token>
Response: { "user": { "id", "email", "name", "createdAt" } }
```

### PATCH /api/auth/me
```json
Header:   Authorization: Bearer <token>
Body:     { "name": "New Name", "currentPassword": "...", "newPassword": "..." }
Response: { "user": { ... } }
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ECONNREFUSED` on DB | PostgreSQL isn't running — `brew services start postgresql@16` |
| `password authentication failed` | Wrong password in DATABASE_URL |
| `CORS error` in browser | CLIENT_ORIGIN in .env doesn't match your dev server URL |
| `Invalid token` after server restart | JWT_SECRET changed — users must log in again |
| `relation "users" does not exist` | Haven't run schema.sql yet — see Step 3 |

---

## What's next (Phase 2 — DB migration)

When you're ready to move transactions to PostgreSQL, the plan is:
1. Add `transactions`, `recurring_templates`, `budgets` tables to schema.sql
2. Add a `POST /api/transactions/sync` endpoint that accepts the localStorage dump
3. On first login, call sync once, then always read/write via API
4. `processRecurring()` moves server-side (cron job or on-login trigger)
