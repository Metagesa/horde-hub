export function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

export function getBearerToken(req: any) {
  const header = String(req.headers.authorization || "");
  const matched = header.match(/^Bearer\s+(.+)$/i);

  if (matched) {
    return matched[1];
  }

  return String(req.headers["x-google-credential"] || "");
}

export async function requireJsonBody(req: any) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string" && req.body.trim()) {
    return JSON.parse(req.body);
  }

  return {};
}
