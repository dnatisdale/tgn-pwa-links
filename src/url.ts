// src/url.ts

/** Return a cleaned https URL or null (reject http and junk). */
export function toHttpsOrNull(input: string): string | null {
  if (!input) return null;
  let s = input.trim();

  // If it already has a scheme
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (u.protocol !== "https:") return null; // reject http:
      return u.toString();
    } catch {
      return null;
    }
  }

  // No scheme: try to coerce to https
  try {
    const u = new URL("https://" + s);
    return u.toString();
  } catch {
    return null;
  }
}

/** True only if a string parses to an https: URL. */
export function isHttpsStrict(input: string): boolean {
  return toHttpsOrNull(input) !== null;
}
