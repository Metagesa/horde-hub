import type { GameTable, ParsedMatch } from "@/types";

const DEFAULT_DURATION_MINUTES = 30;

export interface SizeAvailabilityStatus {
  size: string;
  totalCount: number;
  availableCount: number;
  reservedCount: number;
  occupancyRate: number;
}

export interface BoardReservationAssignment {
  gameId: string;
  table: GameTable;
  match: ParsedMatch;
}

function parseSize(size: string): [number, number] | null {
  const parts = String(size)
    .toLowerCase()
    .match(/\d+(?:\.\d+)?/g);

  if (!parts || parts.length < 2) {
    return null;
  }

  return [Number(parts[0]), Number(parts[1])];
}

function parseClockToMinutes(value: string): number | null {
  const matched = String(value || "").match(/^(\d{2}):(\d{2})$/);

  if (!matched) {
    return null;
  }

  return Number(matched[1]) * 60 + Number(matched[2]);
}

function getDurationMinutes(duration: string): number | null {
  if (!duration || duration === "TODO_EL_DIA") {
    return null;
  }

  return parseClockToMinutes(duration);
}

function getMatchEndMinutes(match: ParsedMatch): number | null {
  const startMinutes = parseClockToMinutes(match.time);
  if (startMinutes === null) {
    return null;
  }

  if (match.duration === "TODO_EL_DIA") {
    return 24 * 60;
  }

  const durationMinutes = getDurationMinutes(match.duration);
  return startMinutes + (durationMinutes || DEFAULT_DURATION_MINUTES);
}

function getRequestedEndMinutes(
  startTime: string,
  duration: string
): number | null {
  const startMinutes = parseClockToMinutes(startTime);
  if (startMinutes === null) {
    return null;
  }

  if (duration === "TODO_EL_DIA") {
    return 24 * 60;
  }

  const durationMinutes = getDurationMinutes(duration);
  return startMinutes + (durationMinutes || DEFAULT_DURATION_MINUTES);
}

function compareMatches(a: ParsedMatch, b: ParsedMatch): number {
  const createdAtComparison = String(a.createdAt || "").localeCompare(
    String(b.createdAt || "")
  );

  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return String(a.id).localeCompare(String(b.id));
}

function getArea(size: string): number {
  const parsed = parseSize(size);
  if (!parsed) {
    return Number.POSITIVE_INFINITY;
  }

  return parsed[0] * parsed[1];
}

function getEnabledTables(tables: GameTable[]): GameTable[] {
  return [...tables]
    .filter((table) => table.enabled)
    .sort((a, b) => a.columnIndex - b.columnIndex);
}

function getLegacyReservationSize(
  match: ParsedMatch,
  tables: GameTable[]
): string {
  if (match.tableSize && tables.some((table) => table.size === match.tableSize)) {
    return match.tableSize;
  }

  if (
    match.tableId &&
    !tables.some((table) => table.tableId === match.tableId) &&
    tables.some((table) => table.size === match.tableId)
  ) {
    return match.tableId;
  }

  return "";
}

function isActiveReservation(match: ParsedMatch, selectedDate: string): boolean {
  return (
    (Boolean(match.tableId) || Boolean(match.tableSize)) &&
    match.date === selectedDate &&
    !match.played
  );
}

function isMatchOccupyingTimeSlot(
  match: ParsedMatch,
  selectedDate: string,
  time: string
): boolean {
  if (!isActiveReservation(match, selectedDate)) {
    return false;
  }

  const slotMinutes = parseClockToMinutes(time);
  const startMinutes = parseClockToMinutes(match.time);
  const endMinutes = getMatchEndMinutes(match);

  if (slotMinutes === null || startMinutes === null || endMinutes === null) {
    return false;
  }

  return slotMinutes >= startMinutes && slotMinutes < endMinutes;
}

function isTableReservedForRange(
  match: ParsedMatch,
  tables: GameTable[],
  selectedDate: string,
  tableId: string,
  startTime: string,
  duration: string
): boolean {
  if (!isActiveReservation(match, selectedDate)) {
    return false;
  }

  const targetTable = tables.find((table) => table.tableId === tableId);
  if (!targetTable) {
    return false;
  }

  const exactReservation = match.tableId === tableId;
  const legacySize = getLegacyReservationSize(match, tables);
  const legacyReservation = !exactReservation && legacySize === targetTable.size;

  if (!exactReservation && !legacyReservation) {
    return false;
  }

  const existingStart = parseClockToMinutes(match.time);
  const existingEnd = getMatchEndMinutes(match);
  const requestedStart = parseClockToMinutes(startTime);
  const requestedEnd = getRequestedEndMinutes(startTime, duration);

  if (
    existingStart === null ||
    existingEnd === null ||
    requestedStart === null ||
    requestedEnd === null
  ) {
    return false;
  }

  return requestedStart < existingEnd && existingStart < requestedEnd;
}

function resolveAssignmentsForTimeSlot(
  tables: GameTable[],
  allMatches: Record<string, ParsedMatch[]>,
  selectedTime: string,
  selectedDate: string
): BoardReservationAssignment[] {
  const enabledTables = getEnabledTables(tables);
  const tableMap = new Map(enabledTables.map((table) => [table.tableId, table]));
  const usedTableIds = new Set<string>();

  const pendingAssignments = Object.entries(allMatches)
    .flatMap(([gameId, matches]) =>
      matches
        .filter((match) => isMatchOccupyingTimeSlot(match, selectedDate, selectedTime))
        .map((match) => ({ gameId, match }))
    )
    .sort((a, b) => compareMatches(a.match, b.match));

  const assignments: BoardReservationAssignment[] = [];

  pendingAssignments.forEach(({ gameId, match }) => {
    const exactTable = tableMap.get(match.tableId);

    if (exactTable && !usedTableIds.has(exactTable.tableId)) {
      usedTableIds.add(exactTable.tableId);
      assignments.push({ gameId, table: exactTable, match });
    }
  });

  pendingAssignments.forEach(({ gameId, match }) => {
    if (assignments.some((assignment) => assignment.match.id === match.id)) {
      return;
    }

    const legacySize = getLegacyReservationSize(match, enabledTables);
    if (!legacySize) {
      return;
    }

    const fallbackTable = enabledTables.find(
      (table) => table.size === legacySize && !usedTableIds.has(table.tableId)
    );

    if (!fallbackTable) {
      return;
    }

    usedTableIds.add(fallbackTable.tableId);
    assignments.push({ gameId, table: fallbackTable, match });
  });

  return assignments.sort((a, b) => {
    const areaComparison = getArea(a.table.size) - getArea(b.table.size);
    if (areaComparison !== 0) {
      return areaComparison;
    }

    const tableComparison = a.table.columnIndex - b.table.columnIndex;
    if (tableComparison !== 0) {
      return tableComparison;
    }

    return compareMatches(a.match, b.match);
  });
}

export function canTableFitMatch(
  availableSize: string,
  requiredSize: string
): boolean {
  if (!availableSize || !requiredSize) {
    return false;
  }

  const available = parseSize(availableSize);
  const required = parseSize(requiredSize);

  if (!available || !required) {
    return availableSize === requiredSize;
  }

  const [availableWidth, availableHeight] = available;
  const [requiredWidth, requiredHeight] = required;

  return (
    (availableWidth >= requiredWidth && availableHeight >= requiredHeight) ||
    (availableWidth >= requiredHeight && availableHeight >= requiredWidth)
  );
}

export function chooseBestTable(
  tables: GameTable[],
  allMatches: Record<string, ParsedMatch[]>,
  selectedTime: string,
  selectedDate: string,
  matchSize: string,
  duration: string
): GameTable | null {
  const compatibleTables = tables
    .filter((table) => table.enabled && canTableFitMatch(table.size, matchSize))
    .filter(
      (table) =>
        !Object.values(allMatches)
          .flat()
          .some((match) =>
            isTableReservedForRange(
              match,
              tables,
              selectedDate,
              table.tableId,
              selectedTime,
              duration
            )
          )
    )
    .sort((a, b) => {
      const areaComparison = getArea(a.size) - getArea(b.size);
      if (areaComparison !== 0) {
        return areaComparison;
      }

      return a.columnIndex - b.columnIndex;
    });

  return compatibleTables[0] || null;
}

export function getCompatibleTableStatuses(
  tables: GameTable[],
  allMatches: Record<string, ParsedMatch[]>,
  selectedTime: string,
  selectedDate: string,
  matchSize: string,
  duration: string
): SizeAvailabilityStatus[] {
  const grouped = new Map<string, SizeAvailabilityStatus>();

  tables
    .filter((table) => table.enabled && canTableFitMatch(table.size, matchSize))
    .forEach((table) => {
      const existing =
        grouped.get(table.size) ||
        ({
          size: table.size,
          totalCount: 0,
          availableCount: 0,
          reservedCount: 0,
          occupancyRate: 0,
        } as SizeAvailabilityStatus);

      const reserved = Object.values(allMatches)
        .flat()
        .some((match) =>
          isTableReservedForRange(
            match,
            tables,
            selectedDate,
            table.tableId,
            selectedTime,
            duration
          )
        );

      existing.totalCount += 1;
      existing.reservedCount += reserved ? 1 : 0;
      existing.availableCount += reserved ? 0 : 1;
      existing.occupancyRate =
        existing.totalCount > 0
          ? existing.reservedCount / existing.totalCount
          : 0;

      grouped.set(table.size, existing);
    });

  return Array.from(grouped.values()).sort(
    (a, b) => getArea(a.size) - getArea(b.size)
  );
}

export function getSizeOccupancyStatuses(
  tables: GameTable[],
  allMatches: Record<string, ParsedMatch[]>,
  selectedTime: string,
  selectedDate: string
): SizeAvailabilityStatus[] {
  const grouped = new Map<string, SizeAvailabilityStatus>();
  const reservedTableIds = new Set(
    resolveAssignmentsForTimeSlot(tables, allMatches, selectedTime, selectedDate).map(
      (assignment) => assignment.table.tableId
    )
  );

  tables
    .filter((table) => table.enabled)
    .forEach((table) => {
      const existing =
        grouped.get(table.size) ||
        ({
          size: table.size,
          totalCount: 0,
          availableCount: 0,
          reservedCount: 0,
          occupancyRate: 0,
        } as SizeAvailabilityStatus);

      const reserved = reservedTableIds.has(table.tableId);

      existing.totalCount += 1;
      existing.reservedCount += reserved ? 1 : 0;
      existing.availableCount += reserved ? 0 : 1;
      existing.occupancyRate =
        existing.totalCount > 0
          ? existing.reservedCount / existing.totalCount
          : 0;

      grouped.set(table.size, existing);
    });

  return Array.from(grouped.values()).sort(
    (a, b) => getArea(a.size) - getArea(b.size)
  );
}

export function getBoardReservationAssignments(
  tables: GameTable[],
  allMatches: Record<string, ParsedMatch[]>,
  selectedTime: string,
  selectedDate: string
): BoardReservationAssignment[] {
  return resolveAssignmentsForTimeSlot(
    tables,
    allMatches,
    selectedTime,
    selectedDate
  );
}

export function getDatesFromMatches(
  allMatches: Record<string, ParsedMatch[]>
): string[] {
  return Array.from(
    new Set(
      Object.values(allMatches)
        .flat()
        .map((match) => match.date)
        .filter(Boolean)
    )
  ).sort();
}

export function getTimesFromMatches(
  allMatches: Record<string, ParsedMatch[]>,
  date?: string
): string[] {
  return Array.from(
    new Set(
      Object.values(allMatches)
        .flat()
        .filter((match) => !date || match.date === date)
        .map((match) => match.time)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

export function getUnreservedMatches(
  allMatches: Record<string, ParsedMatch[]>,
  selectedDate: string
): ParsedMatch[] {
  return Object.values(allMatches)
    .flat()
    .filter(
      (match) => match.date === selectedDate && !match.played && !match.tableId
    )
    .sort((a, b) => a.time.localeCompare(b.time));
}
