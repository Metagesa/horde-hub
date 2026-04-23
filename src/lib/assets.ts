export function getPublicAssetPath(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${normalizedPath}`;
}

export const clubLogoUrl = getPublicAssetPath("images/logoclub.webp");
