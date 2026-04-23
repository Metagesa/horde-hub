import { GAME_CONFIGS } from "../src/lib/localData";
import { getBoardAvailability } from "../server/boardStore";
import { json } from "../server/http";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { message: "Metodo no permitido" });
  }

  const selectedDate = String(req.query.date || "").trim();

  try {
    const availability = await getBoardAvailability(
      GAME_CONFIGS.map((config) => config.gameId),
      selectedDate
    );
    return json(res, 200, availability);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la disponibilidad de tablones";
    return json(res, 500, { message });
  }
}
