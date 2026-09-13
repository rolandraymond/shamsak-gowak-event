CREATE TABLE guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  invitation_code TEXT UNIQUE,

  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,

  specialty TEXT,
  hospital TEXT,

  group_name TEXT,

  is_vip INTEGER NOT NULL DEFAULT 0,
  vip_level TEXT,

  rsvp_status TEXT NOT NULL DEFAULT 'pending',

  table_number INTEGER,
  seat_number INTEGER,

  qr_token TEXT UNIQUE,

  whatsapp_status TEXT DEFAULT 'pending',
  email_status TEXT DEFAULT 'pending',

  checked_in INTEGER NOT NULL DEFAULT 0,
  checked_in_at TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guests_phone
ON guests(phone);

CREATE INDEX idx_guests_email
ON guests(email);

CREATE INDEX idx_guests_rsvp
ON guests(rsvp_status);

CREATE INDEX idx_guests_table
ON guests(table_number);

CREATE INDEX idx_guests_vip
ON guests(is_vip);