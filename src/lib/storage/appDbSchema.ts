/** DDL for the unified tdmusic SQLite database (music cache + play history). */
export const APP_DB_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS track_meta (
  source_url TEXT PRIMARY KEY NOT NULL,
  id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'ready')),
  downloaded_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
  source_url TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  data BLOB NOT NULL,
  mime_type TEXT,
  size INTEGER NOT NULL,
  PRIMARY KEY (source_url, relative_path)
);

CREATE TABLE IF NOT EXISTS track_extracted (
  source_url TEXT PRIMARY KEY NOT NULL,
  title TEXT,
  artist TEXT,
  album TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS download_queue (
  source_url TEXT PRIMARY KEY NOT NULL,
  id TEXT,
  added_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS play_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS play_history_started_at ON play_history (started_at);
`;

export const APP_DB_FILENAME = '/tdmusic.sqlite3';
export const APP_DB_SAH_POOL_NAME = 'tdmusic';
