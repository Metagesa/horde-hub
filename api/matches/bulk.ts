import { json } from "../../server/http.js";
import { getDatabaseErrorStatus } from "../../server/database.js";
import { listMatchesByGameIds } from "../../server/matchStore.js";

function getGameIds(query: Record<string, unknown>) {
  const raw = query.gameId ?? query.gameIds ?? [];

  if (Array.isArray(raw)) {
    return raw.map((value) => String(value).trim()).filter(Boolean);
  }

  return String(raw)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { message: "Metodo no permitido" });
  }

  try {
    const gameIds = getGameIds(req.query || {});
    const matches = await listMatchesByGameIds(gameIds);
    return json(res, 200, matches);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar los partidos";
    return json(res, getDatabaseErrorStatus(error), { message });
  }
}
