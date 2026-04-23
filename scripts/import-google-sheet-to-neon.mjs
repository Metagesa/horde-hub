import { neon } from "@neondatabase/serverless";

const APPS_SCRIPT_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbwcmcsrOj7K28SPkiBNpDvcZlTslMxzNM2APiN5XYDwrvkJcjnwK3cspym4XcQ-HQfm/exec";

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(DATABASE_URL);

function hasResultData(match) {
  return (
    (match.scoreA !== "" &&
      match.scoreA !== null &&
      match.scoreA !== undefined) ||
    (match.scoreB !== "" &&
      match.scoreB !== null &&
      match.scoreB !== undefined) ||
    Boolean(String(match.playerATime || "").trim()) ||
    Boolean(String(match.playerBTime || "").trim())
  );
}

function deriveMatchState(match) {
  const played = hasResultData(match);

  return {
    played,
    status: played ? "completed" : "scheduled",
  };
}

function normalizeDate(date = "") {
  return date.includes("T") ? date.split("T")[0] : date;
}

function normalizeTime(value = "") {
  const isoMatch = String(value).match(/T(\d{2}):(\d{2})/);

  if (isoMatch) {
    return `${isoMatch[1]}:${isoMatch[2]}`;
  }

  const matched = String(value)
    .trim()
    .match(/^(\d{1,3}):(\d{2})(?::(\d{2}))?$/);

  if (!matched) {
    return String(value || "");
  }

  return `${String(Number(matched[1])).padStart(2, "0")}:${matched[2]}`;
}

function normalizePlayerClock(value = "") {
  const matched = String(value)
    .trim()
    .match(/^(\d{1,3}):(\d{2})(?::(\d{2}))?$/);

  if (!matched) {
    return String(value || "");
  }

  if (matched[3]) {
    const totalMinutes = Number(matched[1]) * 60 + Number(matched[2]);
    return `${String(totalMinutes).padStart(2, "0")}:${matched[3]}`;
  }

  return `${String(Number(matched[1])).padStart(2, "0")}:${matched[2]}`;
}

function normalizeRow(gameId, row) {
  const scoreA =
    row.scoreA !== "" && row.scoreA !== undefined ? Number(row.scoreA) : null;
  const scoreB =
    row.scoreB !== "" && row.scoreB !== undefined ? Number(row.scoreB) : null;
  const playerATime = normalizePlayerClock(row.playerATime);
  const playerBTime = normalizePlayerClock(row.playerBTime);
  const state = deriveMatchState({ scoreA, scoreB, playerATime, playerBTime });

  return {
    game_id: gameId,
    legacy_id: String(row.id ?? ""),
    date: normalizeDate(row.date),
    time: normalizeTime(row.time),
    duration: row.duration ? normalizeTime(row.duration) : null,
    player_a: String(row.playerA || ""),
    faction_a: String(row.factionA || ""),
    player_b: String(row.playerB || ""),
    faction_b: String(row.factionB || ""),
    table_id: row.tableId ? String(row.tableId) : null,
    table_size: row.tableSize ? String(row.tableSize) : null,
    match_size: row.matchSize ? String(row.matchSize) : null,
    player_a_time: playerATime || null,
    player_b_time: playerBTime || null,
    score_a: Number.isFinite(scoreA) ? scoreA : null,
    score_b: Number.isFinite(scoreB) ? scoreB : null,
    played: row.played === true || row.played === "true" || state.played,
    status: state.status,
  };
}

async function fetchGameMatches(gameId) {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("type", "matches");
  url.searchParams.set("gameId", gameId);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch matches for ${gameId}: ${res.status}`);
  }

  const text = await res.text();

  if (!text.trim()) {
    return [];
  }

  if (text.trim().startsWith("<")) {
    console.warn(`Skipping ${gameId}: source did not return JSON`);
    return [];
  }

  try {
    return JSON.parse(text);
  } catch {
    console.warn(`Skipping ${gameId}: source payload was not valid JSON`);
    return [];
  }
}

async function main() {
  const gameIds = process.argv.slice(2);

  if (gameIds.length === 0) {
    throw new Error("Pass at least one gameId");
  }

  for (const gameId of gameIds) {
    const rows = await fetchGameMatches(gameId);
    let importedCount = 0;

    for (const row of rows) {
      const normalized = normalizeRow(gameId, row);

      await sql.query(
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
           updated_at = now()`,
        [
          normalized.game_id,
          normalized.legacy_id,
          normalized.date,
          normalized.time,
          normalized.duration,
          normalized.player_a,
          normalized.faction_a,
          normalized.player_b,
          normalized.faction_b,
          normalized.table_id,
          normalized.table_size,
          normalized.match_size,
          normalized.player_a_time,
          normalized.player_b_time,
          normalized.score_a,
          normalized.score_b,
          normalized.played,
          normalized.status,
        ]
      );

      importedCount += 1;
    }

    console.log(`Imported ${importedCount} matches for ${gameId}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
