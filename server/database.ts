import { neon } from "@neondatabase/serverless";

let sqlClient: ReturnType<typeof neon> | null = null;

export function getDatabaseUrl() {
  const value = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!value) {
    throw new Error("DATABASE_URL is not configured");
  }

  return value;
}

export function getSql() {
  if (!sqlClient) {
    sqlClient = neon(getDatabaseUrl());
  }

  return sqlClient;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || "");
}

export function isDatabaseUnavailableError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("database_url is not configured") ||
    message.includes('relation "matches" does not exist') ||
    message.includes('relation "board_tables" does not exist') ||
    message.includes('relation "board_time_slots" does not exist') ||
    message.includes("fetch failed") ||
    message.includes("connection") ||
    message.includes("connect timeout") ||
    message.includes("econn") ||
    message.includes("enotfound") ||
    message.includes("etimedout")
  );
}

export function getDatabaseErrorStatus(error: unknown) {
  return isDatabaseUnavailableError(error) ? 503 : 500;
}
