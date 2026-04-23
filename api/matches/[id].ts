import { verifyAdminCredential } from "../../server/adminAuth";
import { json, getBearerToken, requireJsonBody } from "../../server/http";
import { deleteMatch, updateMatch } from "../../server/matchStore";

export default async function handler(req: any, res: any) {
  const id = String(req.query.id || "").trim();

  if (!id) {
    return json(res, 400, { success: false, message: "id es requerido" });
  }

  const credential = getBearerToken(req);
  const isAdmin = await verifyAdminCredential(credential);

  if (!isAdmin) {
    return json(res, 401, { success: false, message: "No autorizado" });
  }

  if (req.method === "PATCH") {
    try {
      const body = await requireJsonBody(req);
      const match = await updateMatch(id, body);

      if (!match) {
        return json(res, 404, { success: false, message: "Partido no encontrado" });
      }

      return json(res, 200, { success: true, match });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el partido";
      return json(res, 500, { success: false, message });
    }
  }

  if (req.method === "DELETE") {
    const gameId = String(req.query.gameId || "").trim();

    if (!gameId) {
      return json(res, 400, { success: false, message: "gameId es requerido" });
    }

    try {
      const deleted = await deleteMatch(id, gameId);
      return json(res, 200, { success: deleted });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo eliminar el partido";
      return json(res, 500, { success: false, message });
    }
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return json(res, 405, { message: "Metodo no permitido" });
}
