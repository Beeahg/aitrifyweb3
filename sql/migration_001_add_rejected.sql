-- Migration 001: Thêm status 'rejected' vào CHECK constraint
-- SQLite không hỗ trợ ALTER CHECK — cần recreate table
-- Deploy: wrangler d1 execute aitrify-db --file=sql/migration_001_add_rejected.sql

PRAGMA foreign_keys=OFF;

CREATE TABLE enterprises_new (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  company            TEXT NOT NULL,
  email              TEXT UNIQUE NOT NULL,
  email_domain       TEXT NOT NULL,
  password_hash      TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending_email'
                       CHECK(status IN ('pending_email', 'pending_review', 'active', 'suspended', 'rejected')),
  verification_token TEXT,
  token_expires_at   INTEGER,
  created_at         INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at         INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT INTO enterprises_new SELECT * FROM enterprises;

DROP TABLE enterprises;
ALTER TABLE enterprises_new RENAME TO enterprises;

CREATE INDEX IF NOT EXISTS idx_enterprises_email
  ON enterprises(email);
CREATE INDEX IF NOT EXISTS idx_enterprises_verification_token
  ON enterprises(verification_token);
CREATE INDEX IF NOT EXISTS idx_enterprises_email_domain
  ON enterprises(email_domain);
CREATE INDEX IF NOT EXISTS idx_enterprises_status
  ON enterprises(status);

PRAGMA foreign_keys=ON;
