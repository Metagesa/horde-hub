CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id text,
  game_id text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  duration text,
  player_a text NOT NULL,
  faction_a text NOT NULL,
  player_b text NOT NULL DEFAULT '',
  faction_b text NOT NULL DEFAULT '',
  table_id text,
  table_size text,
  match_size text,
  player_a_time text,
  player_b_time text,
  score_a integer,
  score_b integer,
  played boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS board_tables (
  table_id text PRIMARY KEY,
  size text NOT NULL,
  label text NOT NULL,
  column_index integer NOT NULL,
  enabled boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS board_time_slots (
  time text PRIMARY KEY,
  sort_order integer NOT NULL
);

DROP INDEX IF EXISTS matches_game_legacy_id_unique;

CREATE UNIQUE INDEX IF NOT EXISTS matches_game_legacy_id_unique
  ON matches (game_id, legacy_id);

CREATE INDEX IF NOT EXISTS matches_game_date_time_idx
  ON matches (game_id, date, time);

CREATE INDEX IF NOT EXISTS matches_game_created_at_idx
  ON matches (game_id, created_at);

CREATE INDEX IF NOT EXISTS matches_active_reservations_by_date_idx
  ON matches (date, time, game_id)
  WHERE played = false AND (table_id IS NOT NULL OR table_size IS NOT NULL);
