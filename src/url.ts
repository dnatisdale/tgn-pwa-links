// src/url.ts
/**
 * Force a URL to https:
 * - If it starts with https:// keep it
 * - If it starts with http:// change to https://
 * - If it has no scheme, prepend https://
 * - Validate with URL() and ensure it has a hostname
 * - Return null if invalid
 */
export function forceHttps(input: string): string | null {
  if (!input) return null;
  let s = input.trim();

  // add https:// if missing scheme
  if (!/^https?:\/\//i.test(s)) {
    s = "https://" + s.replace(/^\/+/, "");
  } else if (/^http:\/\//i.test(s)) {
    s = s.replace(/^http:\/\//i, "https://");
  }

  try {
    const u = new URL(s);
    if (!u.hostname) return null;
    // optional: strip spaces etc.
    return u.toString();
  } catch {
    return null;
  }
}

/** Backward-compatible alias used by some files */
export const toHttpsOrNull = forceHttps;
export const normalizeHttps = forceHttps;
