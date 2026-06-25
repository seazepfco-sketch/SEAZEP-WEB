CREATE TABLE IF NOT EXISTS license_activity_events (
  id TEXT PRIMARY KEY,
  license_db_id TEXT,
  license_code TEXT NOT NULL,
  company_id TEXT,
  company_name TEXT,
  product_id TEXT,
  product_slug TEXT,
  machine_id TEXT,
  device_label TEXT,
  app_version TEXT,
  event_type TEXT NOT NULL,
  event_source TEXT DEFAULT 'smartpozo360',
  result TEXT DEFAULT 'accepted',
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  server_timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_license_activity_created_at
ON license_activity_events(created_at);

CREATE INDEX IF NOT EXISTS idx_license_activity_license_code
ON license_activity_events(license_code);

CREATE INDEX IF NOT EXISTS idx_license_activity_company_id
ON license_activity_events(company_id);

CREATE INDEX IF NOT EXISTS idx_license_activity_machine_id
ON license_activity_events(machine_id);

CREATE INDEX IF NOT EXISTS idx_license_activity_event_type
ON license_activity_events(event_type);