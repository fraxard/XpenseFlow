# XpenseFlow

A personal finance and expense tracking web app. Track income and expenses, set budgets, manage recurring transactions, and generate detailed reports — all stored locally on your machine.

![Version](https://img.shields.io/badge/version-0.75.2-blue) ![Stack](https://img.shields.io/badge/stack-Vanilla%20JS%20%2B%20Node.js-green)

---

## Features

- **Transaction tracking** — Add income and expenses with categories, dates, and optional receipt photos
- **Custom categories** — Create your own expense and income categories per account
- **Recurring transactions** — Set up daily, weekly, or monthly recurring entries that auto-insert on schedule
- **Budgets** — Set spending limits per category or across all expenses, with live progress tracking and over-budget alerts
- **Search & filter** — Search transactions by name, category, date, type, or amount
- **Full reports page** — Period-based summaries (day/week/month/year) with charts, heatmap, smart insights, and month-over-month comparisons
- **Export** — Download reports as `.xlsx` (8 sheets) or `.docx` (formatted Word document)
- **Auth** — Register and sign in; each account's data is isolated on the local machine
- **Guest mode** — Works fully without an account; data lives in localStorage
- **Dark/light theme** — Persists across sessions
- **Multi-currency** — USD, EUR, GBP, INR, JPY, AUD, CAD
- **LAN access** — Serve to other devices on your local network

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS, HTML, CSS — no frameworks |
| Charts | Canvas API (no chart libraries) |
| Export | SheetJS (xlsx), docx.js |
| Auth backend | Node.js, Express, PostgreSQL |
| Auth | JWT + bcrypt |
| Storage | localStorage (per-user namespaced) |
| Packaging (planned) | Electron (desktop), Capacitor (Android) |

---

## Project Structure

```
xpenseflow/
├── index.html          # Main dashboard
├── reports.html        # Full reports page
├── script.js           # Core app logic (transactions, budgets, recurring)
├── reports.js          # Reports page logic and charts
├── auth-api.js         # Frontend auth client (login/register/token)
├── db-api.js           # Local data layer (localStorage namespace manager)
├── style.css           # Main styles
├── reportsStyle.css    # Reports-page styles
├── favicon.svg
└── xpenseflow-backend/
    ├── src/
    │   ├── index.js                        # Express entry point
    │   ├── db/
    │   │   ├── pool.js                     # PostgreSQL connection pool
    │   │   └── schema.sql                  # Database schema
    │   ├── middleware/
    │   │   └── auth.js                     # JWT requireAuth middleware
    │   ├── routes/
    │   │   ├── auth.js
    │   │   ├── transactions.js
    │   │   ├── recurring.js
    │   │   ├── budgets.js
    │   │   └── categories.js
    │   └── controllers/
    │       ├── authController.js
    │       ├── transactionsController.js
    │       ├── recurringController.js
    │       ├── budgetsController.js
    │       └── categoriesController.js
    ├── package.json
    └── .env            # Not committed — see setup below
```

---

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (for auth only — transaction data stays on the client)
- A static file server for the frontend (e.g. VS Code Live Server, `npx serve`, etc.)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/xpenseflow.git
cd xpenseflow
```

### 2. Set up the backend

```bash
cd xpenseflow-backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/xpenseflow
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
PORT=3001
CLIENT_ORIGINS=http://localhost:5500,http://192.168.x.x:5500
```

> Replace `192.168.x.x` with your machine's LAN IP if you want LAN access from other devices.

### 3. Set up the database

```bash
psql -U postgres -c "CREATE DATABASE xpenseflow;"
psql -U postgres -d xpenseflow -f src/db/schema.sql
```

### 4. Start the backend

```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```

Backend runs on `http://localhost:3001`. Verify with:

```
GET http://localhost:3001/api/health
```

### 5. Serve the frontend

Open `index.html` with Live Server (port 5500) or any static server. That's it — no build step.

---

## How Data Storage Works

XpenseFlow uses a **local-first** architecture:

- All transaction data, budgets, recurring templates, and categories are stored in **localStorage on the user's machine**
- The backend is used **only for authentication** (JWT issuance and validation)
- When a user logs in for the first time on a device, any existing guest data is migrated into their account's namespace (`transactions_<userId>`, etc.)
- Logging out preserves the user's data on that machine — logging back in restores it
- Clearing browser storage will permanently delete all data (by design)
- The same account on two different devices will have separate, independent data

---

## LAN Access

To access XpenseFlow from another device on your network:

1. Find your machine's LAN IP (`ipconfig` on Windows, `ip addr` on Linux/Mac)
2. Add it to `CLIENT_ORIGINS` in your `.env`
3. Open `http://your-lan-ip:5500` on the other device
4. The frontend automatically uses the correct server IP via `window.location.hostname`

---

## Known Limitations / Planned Work

- Guest entries and signed-in entries don't merge on login (guest data is replaced, not merged)
- Editing a recurring template doesn't retroactively update already-inserted history entries
- No cloud sync — data is per-device
- Electron packaging (planned)
- Android APK via Capacitor (planned)

---

## API Reference

All endpoints are under `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register new account |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/me` | ✓ | Get current user |
| PATCH | `/auth/me` | ✓ | Update name/password |

> Transaction, budget, recurring, and category endpoints exist but are currently unused by the frontend (data is localStorage-only). They remain available for future cloud sync.

---

## License

MIT
