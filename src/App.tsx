// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";

// Allow build constants even if types aren’t injected yet
declare const __APP_VERSION__: string | undefined;
declare const __BUILD_DATE__: string | undefined;
declare const __BUILD_TIME__: string | undefined;

// PAGES / PARTS
import InstallPWA from "./InstallPWA"; // expects { lang, className? }
import UpdateToast from "./UpdateToast"; // no props (we'll just show/hide)
import ExportPage from "./Export";       // expects { lang, rows }
import ImportOnly from "./ImportExport"; // expects { lang }
import AddLink from "./AddLink";         // expects { lang }
import Login from "./Login";             // expects { lang, onLang, onSignedIn }
import Share from "./Share";             // use with NO props to match your file

// i18n
import { strings, type Lang } from "./i18n";

// Firebase
import { auth } from "./firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

// Types
export type RecordItem = { id: string; name: string; language: string; url: string };

// Tiny hash router
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/browse");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/browse");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash;
}

// Format Pacific time (24h, no seconds) for footer
function formatPacific(dt = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return fmt.format(dt).replace(",", "");
}

export default function App() {
  // language + text bundle
  const [lang, setLang] = useState<Lang>("en");
  const t = useMemo(() => strings[lang], [lang]);

  // auth
  const [user, setUser] = useState<User | null>(null);

  // local data just to render cards (swap to Firestore later)
  const [data] = useState<RecordItem[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const route = useHashRoute();

  // SW update toast on/off
  const [showUpdate, setShowUpdate] = useState(false);

  // last login (footer fallback)
  const [lastLogin, setLastLogin] = useState<string | undefined>(() =>
    localStorage.getItem("tgn:lastLogin") || undefined
  );

  // ===== AUTH SUBSCRIBE (top-level hook)
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUser(u);
      try {
        const stamp = formatPacific();
        localStorage.setItem("tgn:lastLogin", stamp);
        setLastLogin(stamp);
      } catch {}
    });
    return () => off();
  }, []);

  // ===== SW update wiring
  useEffect(() => {
    (window as any).__tgnOnNeedRefresh = () => setShowUpdate(true);
    (window as any).__tgnUpdateSW = async () => {
      if ((navigator as any).serviceWorker?.controller) {
        (navigator as any).serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      }
      location.reload();
    };
    const handler = () => setShowUpdate(true);
    window.addEventListener("tgn-sw-update", handler as any);
    return () => window.removeEventListener("tgn-sw-update", handler as any);
  }, []);

  // helpers
  const go = (hash: string) => {
    window.location.hash = hash;
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelection((s) => (checked ? [...s, id] : s.filter((x) => x !== id)));
  };

  // Page renderer
  function renderPage() {
    if (route.startsWith("#/login")) {
      return (
        <div className="max-w-lg mx-auto">
          <Login
            lang={lang}
            onLang={(l: Lang) => setLang(l)}
            onSignedIn={() => go("#/browse")}
          />
        </div>
      );
    }

    if (route.startsWith("#/add")) {
      return <AddLink lang={lang} />;
    }

    if (route.startsWith("#/import")) {
      return <ImportOnly lang={lang} />;
    }

    if (route.startsWith("#/export")) {
      return <ExportPage lang={lang} rows={data} />;
    }

    if (route.startsWith("#/about")) {
      return (
        <div className="prose">
          <h1>{t.about}</h1>
          <p>
            Thai Good News (TGN) minimal PWA. Edit this text in <code>App.tsx</code>.
          </p>
          <div className="mt-3">
            {user ? (
              <span className="text-sm opacity-70">Signed in</span>
            ) : (
              <a className="btn btn-blue" href="#/login">
                {t.signIn}
              </a>
            )}
          </div>
        </div>
      );
    }

    // default: BROWSE
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{t.browse}</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((r) => (
            <div className="card" key={r.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-sm opacity-70">{r.language}</div>
                </div>
                <input
                  type="checkbox"
                  checked={selection.includes(r.id)}
                  onChange={(e) => toggleSelect(r.id, e.target.checked)}
                />
              </div>

              <a className="text-sm break-all underline" href={r.url} target="_blank" rel="noreferrer">
                {r.url}
              </a>

              <div className="mt-2 flex gap-2">
                <button className="btn btn-white">{t.edit}</button>
                <button className="btn btn-white">{t.delete}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===== RENDER SHELL
  return (
    <div className="app-shell">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Banner / title */}
          <div className="flex items-center gap-3 banner rounded-xl px-3 py-2">
            <div className="font-bold">{t.appTitle}</div>
          </div>

          {/* Controls (top-right) */}
          <div className="flex items-center gap-2">
            {/* Install PWA (Thai red by className) */}
            <InstallPWA className="btn-red" lang={lang} />

            {/* Share — use with NO props to match your current Props */}
            <Share />

            {/* Font size: A – slider – A (no px readout) */}
            <div className="flex items-center gap-2">
              <span className="text-sm">A</span>
              <input
                className="w-24"
                type="range"
                min={14}
                max={22}
                defaultValue={16}
                onChange={(e) => {
                  document.documentElement.style.fontSize = e.currentTarget.value + "px";
                }}
              />
              <span className="text-lg">A</span>
            </div>

            {/* Language switcher: a/ก */}
            <button className="btn btn-white" onClick={() => setLang(lang === "en" ? "th" : "en")}>
              a/ก
            </button>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="p-3 flex flex-wrap gap-2 text-sm max-w-5xl mx-auto px-4">
        <a className="btn btn-white" href="#/browse">
          {t.browse}
        </a>
        <a className="btn btn-white" href="#/add">
          {t.add}
        </a>
        <a className="btn btn-white" href="#/import">
          {t.import}
        </a>
        <a className="btn btn-white" href="#/export">
          {t.export}
        </a>
        <a className="btn btn-white" href="#/about">
          {t.about}
        </a>
      </nav>

      {/* MAIN */}
      <main className="content max-w-5xl mx-auto px-4 pb-8">{renderPage()}</main>

      {/* FOOTER — Always visible, centered */}
      <footer className="footer">
        <div className="max-w-5xl mx-auto px-4 text-center py-2">
          <div className="text-xs">
            {__APP_VERSION__
              ? `${__APP_VERSION__ || "v0.0.0"} • ${__BUILD_DATE__ ?? ""} ${__BUILD_TIME__ ?? ""}`
              : `Last login • ${lastLogin || formatPacific()}`}
          </div>
        </div>
      </footer>

      {/* UPDATE TOAST — show only, no props */}
      {showUpdate && <UpdateToast />}
    </div>
  );
}
