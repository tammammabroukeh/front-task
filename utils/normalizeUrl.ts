export function normalizeUrl(baseUrl?: string, path?: string): string {
  // Remove trailing slash from base URL if present
  const normalizedBase =
    baseUrl && baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  // Ensure path starts with a slash
  const normalizedPath = path && path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}
