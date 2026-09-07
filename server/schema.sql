CREATE TABLE IF NOT EXISTS platform_sessions (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE TABLE IF NOT EXISTS platform_requests (
  owner_id text NOT NULL,
  request_id text NOT NULL,
  input jsonb NOT NULL,
  scenario text NOT NULL,
  resource_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  submit_count integer NOT NULL DEFAULT 1,
  status_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY(owner_id, request_id)
);
CREATE TABLE IF NOT EXISTS platform_ledger (
  owner_id text NOT NULL,
  request_id text NOT NULL,
  entry jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id, request_id)
);
CREATE TABLE IF NOT EXISTS platform_reports (
  id uuid PRIMARY KEY,
  owner_id text NOT NULL,
  kind text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  share_hash text UNIQUE
);
CREATE INDEX IF NOT EXISTS platform_reports_owner ON platform_reports(owner_id, created_at DESC);
CREATE TABLE IF NOT EXISTS platform_a2a_tasks (
  owner_id text NOT NULL,
  id text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id, id)
);
CREATE TABLE IF NOT EXISTS platform_rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS platform_auth_cache (
  key text PRIMARY KEY,
  value text NOT NULL,
  expires_at timestamptz NOT NULL
);
