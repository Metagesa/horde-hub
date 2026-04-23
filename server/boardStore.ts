import { neon } from "@neondatabase/serverless";
import { TABLES, TABLE_TIME_SLOTS } from "../src/lib/localData";
import { getBoardReservationAssignments } from "../src/lib/tableAvailability";
import type {
  BoardAvailabilityState,
  BoardReservationSlotAssignment,
  GameTable,
  ParsedMatch,
} from "../src/types";
import { listActiveReservationMatchesByDate } from "./matchStore";

type BoardTableRow = {
  table_id: string;
  size: string;
  label: string;
  column_index: number;
  enabled: boolean;
};

type BoardTimeSlotRow = {
  time: string;
  sort_order: number;
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

function mapBoardTable(row: BoardTableRow): GameTable {
  return {
    tableId: row.table_id,
    size: row.size,
    label: row.label,
    columnIndex: row.column_index,
    enabled: row.enabled,
  };
}

export async function listBoardTables(): Promise<GameTable[]> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT table_id, size, label, column_index, enabled
     FROM board_tables
     ORDER BY column_index ASC`
  )) as BoardTableRow[];

  return rows.length > 0 ? rows.map(mapBoardTable) : TABLES;
}

export async function listBoardTimeSlots(): Promise<string[]> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT time, sort_order
     FROM board_time_slots
     ORDER BY sort_order ASC, time ASC`
  )) as BoardTimeSlotRow[];

  return rows.length > 0 ? rows.map((row) => row.time) : TABLE_TIME_SLOTS;
}

function getRelevantTimeSlots(
  timeSlots: string[],
  reservationMatches: BoardAvailabilityState["reservationMatches"]
) {
  const usedTimeSlots = Object.values(reservationMatches)
    .flat()
    .map((match) => match.time)
    .filter(Boolean);

  return Array.from(new Set([...timeSlots, ...usedTimeSlots])).sort((a, b) =>
    a.localeCompare(b)
  );
}

function mapAssignmentsByTime(
  timeSlots: string[],
  tables: GameTable[],
  reservationMatches: Record<string, ParsedMatch[]>,
  selectedDate: string
): Record<string, BoardReservationSlotAssignment[]> {
  return Object.fromEntries(
    timeSlots.map((time) => [
      time,
      getBoardReservationAssignments(tables, reservationMatches, time, selectedDate).map(
        (assignment) => ({
          time,
          tableId: assignment.table.tableId,
          gameId: assignment.gameId,
          match: assignment.match,
        })
      ),
    ])
  );
}

export async function getBoardAvailability(
  gameIds: string[],
  selectedDate: string
): Promise<BoardAvailabilityState> {
  const [tables, baseTimeSlots] = await Promise.all([
    listBoardTables(),
    listBoardTimeSlots(),
  ]);

  if (!selectedDate) {
    return {
      tables,
      timeSlots: baseTimeSlots,
      reservationMatches: {},
      assignmentsByTime: Object.fromEntries(baseTimeSlots.map((time) => [time, []])),
    };
  }

  const reservationMatches = await listActiveReservationMatchesByDate(
    gameIds,
    selectedDate
  );
  const timeSlots = getRelevantTimeSlots(baseTimeSlots, reservationMatches);

  return {
    tables,
    timeSlots,
    reservationMatches,
    assignmentsByTime: mapAssignmentsByTime(
      timeSlots,
      tables,
      reservationMatches,
      selectedDate
    ),
  };
}
