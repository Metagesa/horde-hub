import { GAME_CONFIGS } from "../src/lib/localData.js";
import { getDatabaseErrorStatus } from "../server/database.js";
import { getBoardAvailability } from "../server/boardStore.js";
import { json } from "../server/http.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { message: "Metodo no permitido" });
  }

  const selectedDate = String(req.query.date || "").trim();
  console.log("[board-availability] selectedDate:", selectedDate);

  try {
    console.log("[board-availability] calling getBoardAvailability...");

    const availability = await getBoardAvailability(
      GAME_CONFIGS.map((config) => config.gameId),
      selectedDate
    );

    console.log("[board-availability] success");

    return json(res, 200, availability);
  } catch (error) {
    console.error("[board-availability] ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la disponibilidad de tablones";

    const status = getDatabaseErrorStatus(error);

    console.error("[board-availability] status:", status);
    console.error("[board-availability] message:", message);

    return json(res, status, { message });
  }
}
