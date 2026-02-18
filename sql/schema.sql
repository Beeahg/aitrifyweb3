-- AItrify Enterprise Registration Schema
-- Deploy via: wrangler d1 execute aitrify-db --file=sql/schema.sql

CREATE TABLE IF NOT EXISTS enterprises (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  company            TEXT NOT NULL,
  email              TEXT UNIQUE NOT NULL,
  email_domain       TEXT NOT NULL,
  password_hash      TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending_email'
                       CHECK(status IN ('pending_email', 'pending_review', 'active', 'suspended')),
  verification_token TEXT,
  token_expires_at   INTEGER,
  created_at         INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at         INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_enterprises_email
  ON enterprises(email);

CREATE INDEX IF NOT EXISTS idx_enterprises_verification_token
  ON enterprises(verification_token);

CREATE INDEX IF NOT EXISTS idx_enterprises_email_domain
  ON enterprises(email_domain);

CREATE INDEX IF NOT EXISTS idx_enterprises_status
  ON enterprises(status);
