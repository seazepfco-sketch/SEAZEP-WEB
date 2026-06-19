-- MODELO INICIAL D1 — SEAZEP PLATFORM

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  city TEXT,
  state TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  FOREIGN KEY(company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS software_products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'published',
  license_model TEXT DEFAULT 'annual_device',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS enterprise_requests (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  interest_area TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  license_id TEXT UNIQUE NOT NULL,
  machine_id TEXT,
  status TEXT DEFAULT 'active',
  activated_at TEXT,
  expires_at TEXT,
  max_users INTEGER DEFAULT 3,
  max_devices INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY(company_id) REFERENCES companies(id),
  FOREIGN KEY(product_id) REFERENCES software_products(id)
);

CREATE TABLE IF NOT EXISTS license_activations (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  machine_id TEXT NOT NULL,
  device_label TEXT,
  app_version TEXT,
  status TEXT DEFAULT 'active',
  activated_at TEXT NOT NULL,
  last_check_at TEXT,
  FOREIGN KEY(license_id) REFERENCES licenses(id)
);

CREATE TABLE IF NOT EXISTS license_checks (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL,
  company_id TEXT,
  product_id TEXT,
  machine_id TEXT,
  check_type TEXT,
  result TEXT,
  ip_address TEXT,
  user_agent TEXT,
  checked_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS manuals (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  title TEXT NOT NULL,
  category TEXT,
  version TEXT,
  file_key TEXT,
  visibility TEXT DEFAULT 'private',
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS manual_downloads (
  id TEXT PRIMARY KEY,
  manual_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  company_id TEXT,
  downloaded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL
);
