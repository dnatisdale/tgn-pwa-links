export function normalizeHttps(input: string): string {
  const raw = (input || "").trim();

  if (!raw) return "";

  // If it starts with http:// → make it https://
  if (raw.toLowerCase().startsWith("http://")) {
    return "https://" + raw.slice(7);
  }

  // If it has no scheme at all → add https://
  if (!/^https?:\/\//i.test(raw)) {
    return "https://" + raw;
  }

  // Already https:// or (rare) other scheme
  return raw.replace(/^http:\/\//i, "https://");
}
