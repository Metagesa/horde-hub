import type { ParsedMatch } from "@/types";

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

export function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

export function parseIsoDate(value: string): Date | undefined {
  const matched = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!matched) {
    return undefined;
  }

  return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
}

export function isFridayDate(value: string): boolean {
  const date = parseIsoDate(value);
  return date ? date.getDay() === 5 : false;
}

export function getCurrentOrNextFriday(baseDate = new Date()): string {
  const current = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );
  const daysUntilFriday = (5 - current.getDay() + 7) % 7;
  current.setDate(current.getDate() + daysUntilFriday);
  return toIsoDate(current);
}

export function getNextFridays(count: number): string[] {
  const dates: string[] = [];
  const current = parseIsoDate(getCurrentOrNextFriday()) || new Date();

  for (let i = 0; i < count; i++) {
    dates.push(toIsoDate(current));
    current.setDate(current.getDate() + 7);
  }

  return dates;
}

export function buildFridayOptions(
  matches: ParsedMatch[],
  extraDates: string[] = []
): string[] {
  return Array.from(
    new Set(
      [
        ...matches.map((match) => match.date).filter(Boolean),
        ...getNextFridays(8),
        ...extraDates,
      ].filter(Boolean)
    )
  )
    .filter(isFridayDate)
    .sort((a, b) => a.localeCompare(b));
}

export function formatDateSpanish(value: string): string {
  const parsed = parseIsoDate(value);

  if (!parsed) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function getTodayIsoDate(): string {
  return toIsoDate(new Date());
}

export function isPastDate(date: string): boolean {
  if (!date) {
    return false;
  }

  return date < getTodayIsoDate();
}
