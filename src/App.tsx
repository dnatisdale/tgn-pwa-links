// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";

// PAGES / PARTS that already exist in your project
import InstallPWA from "./InstallPWA"; // accepts { lang, className? }
import UpdateToast from "./UpdateToast";
import ExportPage from "./Export";
import ImportOnly from "./ImportExport";
import AddLink from "./AddLink";
import Login from "./Login";
import Share from "./Share";

// i18n
import { strings, type Lang } from "./i18n";

// Firebase
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

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

// Format Pacific time (24h, no seconds) for footer fallback
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

  // demo data (local array just to keep UI happy)
  const [data] = useState<RecordItem[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const route = useHashRoute();

  // SW update toast
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

  // ===== Handy helpers
  const go = (hash: string) => {
    window.location.hash = hash;
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelection((s) => (checked ? [...s, id] : s.filter((x) => x !== id)));
  };

  // selected pairs for Share (name + url)
  const selectedPairs = data
    .filter((d) => selection.includes(d.id))
    .map(({ name, url }) => ({ name, url }));

  // ===== Login actions (these are used by <Login/> internally if your file supports it; if not, they’re harmless)
  async function handleSignIn(email: string, pw: string) {
    await signInWithEmailAndPassword(auth, email, pw);
    go("#/browse");
  }
  async function handleGuest() {
    await signInAnonymously(auth);
    go("#/browse");
  }
  async function handleSignOut() {
    await signOut(auth);
    go("#/browse");
  }

  // ===== Page renderer (simple and single)
  function renderPage() {
    if (route.startsWith("#/login")) {
      // IMPORTANT: Your Login.tsx Props did not include setLang earlier.
      // So we pass ONLY what’s safe: { lang }.
      // If your Login supports callbacks, wire them inside Login.tsx itself.
      return (
        <div className="max-w-lg mx-auto">
          <Login lang={lang} />
        </div>
      );
    }

    if (route.startsWith("#/add")) {
      // Your AddLink.tsx Props did not include onAdd earlier — so pass only { lang }.
      return <AddLink lang={lang} />;
    }

    if (route.startsWith("#/import")) {
      // Your ImportExport.tsx (Import-only) likely just needs { lang }.
      // We’re not passing onBatchAdd here.
      return <ImportOnly lang={lang} />;
    }

    if (route.startsWith("#/export")) {
      // Export.tsx expects { lang, rows }, not { data }.
      return <ExportPage lang={lang} rows={data} />;
    }

    if (route.startsWith("#/about")) {
      return (
        <div className="prose">
          <h1>{t.about}</h1>
          <p>TGN minimal PWA. You can edit this text in <code>App.tsx</code>.</p>
          <div className="mt-3">
            {user ? (
              <button className="btn btn-ghost" onClick={handleSignOut}>
                Sign out
              </button>
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

              {/* Simple Edit/Delete placeholders (you can wire Firestore later) */}
              <div className="mt-2 flex gap-2">
                <button className="btn btn-white" onClick={() => alert("Edit later (wire Firestore)")}>
                  {t.edit}
                </button>
                <button className="btn btn-white" onClick={() => alert("Delete later (wire Firestore)")}>
                  {t.delete}
                </button>
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

            {/* Share — your Share.tsx Props likely DO NOT include lang; so we pass only { selection } */}
            <Share selection={selectedPairs} />

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
          {/* Show version if defined, else show last login */}
          <div className="text-xs">
            {typeof __APP_VERSION__ !== "undefined" && __APP_VERSION__
              ? `${__APP_VERSION__ || "v0.0.0"} • ${typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : ""} ${
                  typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : ""
                }`
              : `Last login • ${lastLogin || formatPacific()}`}
          </div>
        </div>
      </footer>

      {/* UPDATE TOAST */}
      {showUpdate && (
        <UpdateToast
          onRefresh={() => {
            (window as any).__tgnUpdateSW?.();
          }}
          onSkip={() => setShowUpdate(false)}
        />
      )}
    </div>
  );
}
