// Force https and add scheme when missing
export function normalizeHttps(input: string): string | null {
  if (!input) return null;
  let u = input.trim();
  if (/^https?:\/\//i.test(u) === false) u = "https://" + u;
  // force https only
  u = u.replace(/^http:\/\//i, "https://");
  try { new URL(u); return u.startsWith("https://") ? u : null; }
  catch { return null; }
}

