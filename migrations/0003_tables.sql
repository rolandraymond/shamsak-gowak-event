-- =========================================================
-- EVENT TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS event_tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  table_number INTEGER NOT NULL UNIQUE,

  capacity INTEGER NOT NULL DEFAULT 7,

  table_type TEXT NOT NULL DEFAULT 'regular'
    CHECK (table_type IN ('regular', 'vip')),

  is_active INTEGER NOT NULL DEFAULT 1,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- CREATE 95 TABLES
-- =========================================================

WITH RECURSIVE numbers(n) AS (
  SELECT 1

  UNION ALL

  SELECT n + 1
  FROM numbers
  WHERE n < 95
)

INSERT OR IGNORE INTO event_tables (
  table_number,
  capacity,
  table_type,
  is_active
)
SELECT
  n,
  7,
  'regular',
  1
FROM numbers;


-- =========================================================
-- GUEST GROUPING
-- =========================================================

ALTER TABLE guests
ADD COLUMN group_id TEXT;


-- =========================================================
-- LOCK MANUAL TABLE ASSIGNMENTS
-- =========================================================

ALTER TABLE guests
ADD COLUMN table_locked INTEGER NOT NULL DEFAULT 0;


-- =========================================================
-- PREVENT DOUBLE SEAT ASSIGNMENT
-- =========================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_table_seat
ON guests (
  table_number,
  seat_number
)
WHERE
  table_number IS NOT NULL
  AND seat_number IS NOT NULL;


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_guests_group_id
ON guests(group_id);

CREATE INDEX IF NOT EXISTS idx_guests_table_locked
ON guests(table_locked);

CREATE INDEX IF NOT EXISTS idx_event_tables_type
ON event_tables(table_type);