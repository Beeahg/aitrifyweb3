-- Migration 002: Agent Types & Agent Instances
-- Deploy: npx wrangler d1 execute aitrify-db --remote --file=../../sql/migration_002_agents.sql

-- Bảng loại agent
CREATE TABLE IF NOT EXISTS agent_types (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  industry    TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK(status IN ('active', 'inactive')),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Bảng instances agent của từng doanh nghiệp
CREATE TABLE IF NOT EXISTS agent_instances (
  id            TEXT PRIMARY KEY,
  enterprise_id TEXT NOT NULL REFERENCES enterprises(id),
  agent_type_id TEXT NOT NULL REFERENCES agent_types(id),
  instance_name TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending', 'active', 'suspended', 'rejected')),
  requested_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  approved_at   INTEGER,
  approved_by   TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_instances_enterprise
  ON agent_instances(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_agent_instances_status
  ON agent_instances(status);
CREATE INDEX IF NOT EXISTS idx_agent_instances_type
  ON agent_instances(agent_type_id);

-- Seed data: 5 agent types
INSERT OR IGNORE INTO agent_types (id, name, description, industry, status) VALUES
  ('agent-lisa',     'LISA',     'AI Agent cho ngành Golf — Quản lý đặt sân, tư vấn thiết bị, chăm sóc hội viên',           'Golf',            'active'),
  ('agent-anna',     'ANNA',     'AI Agent cho ngành Điều hòa không khí — Hỗ trợ bảo hành, kỹ thuật, đặt lịch bảo trì',    'Air Conditioning', 'active'),
  ('agent-naga',     'NAGA',     'AI Agent cho ERP & Bảo hành — Tích hợp hệ thống, quản lý warranty đa kênh',               'ERP / Warranty',   'active'),
  ('agent-firesafe', 'FIRESAFE', 'AI Agent cho ngành PCCC — Tư vấn thiết bị, quy trình kiểm tra định kỳ, hỗ trợ pháp lý',  'Fire Safety',      'active'),
  ('agent-mobi',     'MOBI',     'AI Agent cho Bán lẻ di động — Tư vấn sản phẩm, so sánh cấu hình, chăm sóc khách hàng',   'Mobile / Retail',  'active');
