import { neon } from "@neondatabase/serverless";
import { parseMatch, type RawMatch } from "../src/lib/matchNormalization";

type MatchRow = {
  id: string;
  legacy_id: string | null;
  game_id: string;
  date: string;
  time: string;
  duration: string | null;
  player_a: string;
  faction_a: string;
  player_b: string;
  faction_b: string;
  table_id: string | null;
  table_size: string | null;
  match_size: string | null;
  player_a_time: string | null;
  player_b_time: string | null;
  score_a: number | null;
  score_b: number | null;
  played: boolean;
  status: string;
  created_at: string;
};

export type MatchWriteInput = {
  gameId: string;
  legacyId?: string | null;
  date?: string;
  time?: string;
  duration?: string;
  playerA?: string;
  factionA?: string;
  playerB?: string;
  factionB?: string;
  tableId?: string;
  tableSize?: string;
  matchSize?: string;
  playerATime?: string;
  playerBTime?: string;
  scoreA?: number | string | null;
  scoreB?: number | string | null;
  played?: boolean;
  status?: string;
};

let sqlClient: ReturnType<typeof neon> | null = null;

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!value) {
    throw new Error("DATABASE_URL is not configured");
  }

  return value;
}

function getSql() {
  if (!sqlClient) {
    sqlClient = neon(getDatabaseUrl());
  }

  return sqlClient;
}

function mapRowToRawMatch(row: MatchRow): RawMatch {
  return {
    id: row.id,
    date: row.date,
    playerA: row.player_a,
    factionA: row.faction_a,
    playerB: row.player_b,
    factionB: row.faction_b,
    time: row.time,
    tableId: row.table_id || "",
    tableSize: row.table_size || "",
    matchSize: row.match_size || "",
    duration: row.duration || "",
    playerATime: row.player_a_time || "",
    playerBTime: row.player_b_time || "",
    scoreA: row.score_a,
    scoreB: row.score_b,
    played: row.played,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapWriteValue(value?: string | null) {
  return value ? String(value) : null;
}

function mapScoreValue(value?: string | number | null) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeMatchWriteInput(input: MatchWriteInput) {
  return {
    gameId: String(input.gameId || "").trim(),
    legacyId: mapWriteValue(input.legacyId),
    date: String(input.date || "").trim(),
    time: String(input.time || "").trim(),
    duration: mapWriteValue(input.duration),
    playerA: String(input.playerA || "").trim(),
    factionA: String(input.factionA || "").trim(),
    playerB: String(input.playerB || "").trim(),
    factionB: String(input.factionB || "").trim(),
    tableId: mapWriteValue(input.tableId),
    tableSize: mapWriteValue(input.tableSize),
    matchSize: mapWriteValue(input.matchSize),
    playerATime: mapWriteValue(input.playerATime),
    playerBTime: mapWriteValue(input.playerBTime),
    scoreA: mapScoreValue(input.scoreA),
    scoreB: mapScoreValue(input.scoreB),
    played: Boolean(input.played),
    status: String(input.status || "scheduled").trim() || "scheduled",
  };
}

export async function listMatches(gameId: string) {
  const sql = getSql();
  const rows = await sql.query(
    `SELECT *
     FROM matches
     WHERE game_id = $1
     ORDER BY date ASC, time ASC, created_at ASC`,
    [gameId]
  );

  return rows.map((row) => parseMatch(mapRowToRawMatch(row as MatchRow)));
}

export async function listMatchesByGameIds(gameIds: string[]) {
  const uniqueGameIds = [...new Set(gameIds)].filter(Boolean);

  if (uniqueGameIds.length === 0) {
    return {};
  }

  const sql = getSql();
  const rows = await sql.query(
    `SELECT *
     FROM matches
     WHERE game_id = ANY($1::text[])
     ORDER BY game_id ASC, date ASC, time ASC, created_at ASC`,
    [uniqueGameIds]
  );

  const grouped = Object.fromEntries(uniqueGameIds.map((gameId) => [gameId, []]));

  rows.forEach((row) => {
    const record = row as MatchRow;
    grouped[record.game_id].push(parseMatch(mapRowToRawMatch(record)));
  });

  return grouped;
}

export async function listActiveReservationMatchesByDate(
  gameIds: string[],
  selectedDate: string
) {
  const uniqueGameIds = [...new Set(gameIds)].filter(Boolean);

  if (uniqueGameIds.length === 0 || !selectedDate) {
    return {};
  }

  const sql = getSql();
  const rows = await sql.query(
    `SELECT *
     FROM matches
     WHERE game_id = ANY($1::text[])
       AND date = $2::date
       AND played = false
       AND (
         COALESCE(table_id, '') <> ''
         OR COALESCE(table_size, '') <> ''
       )
     ORDER BY game_id ASC, time ASC, created_at ASC`,
    [uniqueGameIds, selectedDate]
  );

  const grouped = Object.fromEntries(uniqueGameIds.map((gameId) => [gameId, []]));

  rows.forEach((row) => {
    const record = row as MatchRow;
    grouped[record.game_id].push(parseMatch(mapRowToRawMatch(record)));
  });

  return grouped;
}

export async function createMatch(input: MatchWriteInput) {
  const sql = getSql();
  const normalized = normalizeMatchWriteInput(input);
  const rows = await sql.query(
    `INSERT INTO matches (
       game_id,
       legacy_id,
       date,
       time,
       duration,
       player_a,
       faction_a,
       player_b,
       faction_b,
       table_id,
       table_size,
       match_size,
       player_a_time,
       player_b_time,
       score_a,
       score_b,
       played,
       status
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9,
       $10, $11, $12, $13, $14, $15, $16, $17, $18
     )
     RETURNING *`,
    [
      normalized.gameId,
      normalized.legacyId,
      normalized.date,
      normalized.time,
      normalized.duration,
      normalized.playerA,
      normalized.factionA,
      normalized.playerB,
      normalized.factionB,
      normalized.tableId,
      normalized.tableSize,
      normalized.matchSize,
      normalized.playerATime,
      normalized.playerBTime,
      normalized.scoreA,
      normalized.scoreB,
      normalized.played,
      normalized.status,
    ]
  );

  return parseMatch(mapRowToRawMatch(rows[0] as MatchRow));
}

export async function updateMatch(id: string, input: MatchWriteInput) {
  const sql = getSql();
  const normalized = normalizeMatchWriteInput(input);
  const rows = await sql.query(
    `UPDATE matches
     SET game_id = $2,
         date = $3,
         time = $4,
         duration = $5,
         player_a = $6,
         faction_a = $7,
         player_b = $8,
         faction_b = $9,
         table_id = $10,
         table_size = $11,
         match_size = $12,
         player_a_time = $13,
         player_b_time = $14,
         score_a = $15,
         score_b = $16,
         played = $17,
         status = $18,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      normalized.gameId,
      normalized.date,
      normalized.time,
      normalized.duration,
      normalized.playerA,
      normalized.factionA,
      normalized.playerB,
      normalized.factionB,
      normalized.tableId,
      normalized.tableSize,
      normalized.matchSize,
      normalized.playerATime,
      normalized.playerBTime,
      normalized.scoreA,
      normalized.scoreB,
      normalized.played,
      normalized.status,
    ]
  );

  if (rows.length === 0) {
    return null;
  }

  return parseMatch(mapRowToRawMatch(rows[0] as MatchRow));
}

export async function deleteMatch(id: string, gameId: string) {
  const sql = getSql();
  const rows = await sql.query(
    `DELETE FROM matches
     WHERE id = $1 AND game_id = $2
     RETURNING id`,
    [id, gameId]
  );

  return rows.length > 0;
}

export async function upsertImportedMatch(input: MatchWriteInput) {
  const sql = getSql();
  const normalized = normalizeMatchWriteInput(input);

  if (!normalized.legacyId) {
    return createMatch(normalized);
  }

  const rows = await sql.query(
    `INSERT INTO matches (
       game_id,
       legacy_id,
       date,
       time,
       duration,
       player_a,
       faction_a,
       player_b,
       faction_b,
       table_id,
       table_size,
       match_size,
       player_a_time,
       player_b_time,
       score_a,
       score_b,
       played,
       status
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9,
       $10, $11, $12, $13, $14, $15, $16, $17, $18
     )
     ON CONFLICT (game_id, legacy_id)
     DO UPDATE SET
       date = EXCLUDED.date,
       time = EXCLUDED.time,
       duration = EXCLUDED.duration,
       player_a = EXCLUDED.player_a,
       faction_a = EXCLUDED.faction_a,
       player_b = EXCLUDED.player_b,
       faction_b = EXCLUDED.faction_b,
       table_id = EXCLUDED.table_id,
       table_size = EXCLUDED.table_size,
       match_size = EXCLUDED.match_size,
       player_a_time = EXCLUDED.player_a_time,
       player_b_time = EXCLUDED.player_b_time,
       score_a = EXCLUDED.score_a,
       score_b = EXCLUDED.score_b,
       played = EXCLUDED.played,
       status = EXCLUDED.status,
       updated_at = now()
     RETURNING *`,
    [
      normalized.gameId,
      normalized.legacyId,
      normalized.date,
      normalized.time,
      normalized.duration,
      normalized.playerA,
      normalized.factionA,
      normalized.playerB,
      normalized.factionB,
      normalized.tableId,
      normalized.tableSize,
      normalized.matchSize,
      normalized.playerATime,
      normalized.playerBTime,
      normalized.scoreA,
      normalized.scoreB,
      normalized.played,
      normalized.status,
    ]
  );

  return parseMatch(mapRowToRawMatch(rows[0] as MatchRow));
}
