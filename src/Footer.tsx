// src/Footer.tsx
// 01 — Build-time constants injected by vite.config.ts
declare const __APP_VERSION__: string | undefined;   // e.g. "1.1.6"
declare const __BUILD_PRETTY__: string | undefined;  // e.g. "October 21, 2025 | 5:20AM"
declare const __BUILD_ID__: string | undefined;      // e.g. "a1b2c3d"

// 02 — Single, clean default export (no duplicates)
export default function Footer() {
  const version = (__APP_VERSION__ ?? "dev").trim();
  const pretty  = (__BUILD_PRETTY__ ?? "").trim();
  const code    = (__BUILD_ID__ ?? "").trim();

  const lastLoginISO = localStorage.getItem("tgnLastLoginISO") || "";
  const lastLogin = lastLoginISO
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        month: "long", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
      }).format(new Date(lastLoginISO))
        .replace(" AM", "AM").replace(" PM", "PM")
    : "";

  return (
    <footer className="border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4 py-2 text-center text-xs text-gray-700">
        {`v${version}`}{pretty ? ` • ${pretty}` : ""}{code ? ` • ${code}` : ""}
        {lastLogin && (
          <div className="mt-1 text-[11px] text-gray-500">Last login: {lastLogin}</div>
        )}
      </div>
    </footer>
  );
}
