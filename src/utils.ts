// Force https and add scheme when missing
export function normalizeHttps(raw: string): string {
  let u = (raw || "").trim();
  if (!u) return "";
  if (u.startsWith("//")) u = "https:" + u;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  u = u.replace(/^http:\/\//i, "https://");
  return u;
}
