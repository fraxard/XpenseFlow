-- XpenseFlow Database Schema
-- Run this once against your PostgreSQL database:
--   psql -U postgres -d xpenseflow -f src/db/schema.sql

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    email       TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    password    TEXT    NOT NULL,          -- bcrypt hash
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fast email lookups (login)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (LOWER(email));

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ─────────────────────────────────────────
-- FUTURE TABLES (placeholders — Phase 2)
-- ─────────────────────────────────────────
-- transactions, recurring_templates, budgets will be added
-- in the DB migration phase. For now only users is needed.
