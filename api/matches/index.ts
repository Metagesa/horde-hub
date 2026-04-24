import { verifyAdminCredential } from "../../server/adminAuth.js";
import { getDatabaseErrorStatus } from "../../server/database.js";
import { json, getBearerToken, requireJsonBody } from "../../server/http.js";
import { createMatch, listMatches } from "../../server/matchStore.js";

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const gameId = String(req.query.gameId || "").trim();

    if (!gameId) {
      return json(res, 400, { message: "gameId es requerido" });
    }

    try {
      const matches = await listMatches(gameId);
      return json(res, 200, matches);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudieron cargar los partidos";
      return json(res, getDatabaseErrorStatus(error), { message });
    }
  }

  if (req.method === "POST") {
    const credential = getBearerToken(req);
    const isAdmin = await verifyAdminCredential(credential);

    if (!isAdmin) {
      return json(res, 401, { success: false, message: "No autorizado" });
    }

    try {
      const body = await requireJsonBody(req);
      const match = await createMatch(body);
      return json(res, 200, { success: true, match });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el partido";
      return json(res, getDatabaseErrorStatus(error), { success: false, message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return json(res, 405, { message: "Metodo no permitido" });
}
