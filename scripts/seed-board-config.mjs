import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(DATABASE_URL);

const tables = [
  { tableId: "B", size: "90x90", label: "90x90 #1", columnIndex: 2, enabled: true },
  { tableId: "C", size: "90x90", label: "90x90 #2", columnIndex: 3, enabled: true },
  { tableId: "D", size: "180x90", label: "180x90 #1", columnIndex: 4, enabled: true },
  { tableId: "E", size: "180x90", label: "180x90 #2", columnIndex: 5, enabled: true },
  { tableId: "F", size: "220x90", label: "220x90 #1", columnIndex: 6, enabled: true },
  { tableId: "G", size: "220x90", label: "220x90 #2", columnIndex: 7, enabled: true },
];

const timeSlots = [
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

for (const table of tables) {
  await sql.query(
    `INSERT INTO board_tables (table_id, size, label, column_index, enabled)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (table_id)
     DO UPDATE SET
       size = EXCLUDED.size,
       label = EXCLUDED.label,
       column_index = EXCLUDED.column_index,
       enabled = EXCLUDED.enabled`,
    [table.tableId, table.size, table.label, table.columnIndex, table.enabled]
  );
}

for (const [index, time] of timeSlots.entries()) {
  await sql.query(
    `INSERT INTO board_time_slots (time, sort_order)
     VALUES ($1, $2)
     ON CONFLICT (time)
     DO UPDATE SET sort_order = EXCLUDED.sort_order`,
    [time, index]
  );
}

console.log(`Seeded ${tables.length} tables and ${timeSlots.length} time slots`);
