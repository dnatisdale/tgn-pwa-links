// src/utils/formatUrl.ts
// Goal: normalize ANY user input to a single, lowercase "https://..."
// - Accepts: "http://", "HTTP://", "Https://", "www.example.com", "example.com/path"
// - Rejects: non-HTTP(S) schemes (mailto:, ftp:, javascript:), spaces, empty
// - Ensures: exactly one "https://", lowercase scheme + host, preserves path/query/hash

export function formatUrl(raw: string): string | null {
  if (!raw) return null;

  // 1) Trim and strip obvious wrapping junk (quotes, angle brackets)
  let s = raw.trim().replace(/^["'<\[]+|[>"'\]]+$/g, '');

  // Quick reject: spaces inside URL are almost always invalid input
  if (/\s/.test(s)) return null;

  // Convert backslashes to forward slashes (common paste mistake)
  s = s.replace(/\\/g, '/');

  // 2) If it starts with multiple http(s)://, collapse to one (case-insensitive)
  s = s.replace(/^(?:https?:\/\/)+/i, 'https://');

  // 3) If it starts with protocol-relative (//example.com), force https
  if (s.startsWith('//')) s = 'https:' + s;

  // 4) If it starts with some scheme:
  //    - if http/https (any case), normalize to https
  //    - else (mailto:, ftp:, etc.) => reject (we only store web URLs)
  const schemeMatch = s.match(/^([a-z][a-z0-9+\-.]*):\/\//i);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme === 'http' || scheme === 'https') {
      // normalize to https
      s = s.replace(/^https?:\/\//i, 'https://');
    } else {
      return null;
    }
  } else {
    // 5) No scheme: prepend https://
    s = 'https://' + s;
  }

  // 6) Now try to parse; if it fails, it's not a valid URL
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }

  // 7) Force https and lowercase host; keep path/query/hash as typed
  u.protocol = 'https:';
  u.hostname = u.hostname.toLowerCase();

  // 8) Return canonical string (URL.toString keeps trailing slash if no path—fine)
  return u.toString();
}
