// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";

// PAGES / PARTS (these should already exist in your src/)
import InstallPWA from "./InstallPWA"; // NOTE: your InstallPWA must accept { lang, className? }
import UpdateToast from "./UpdateToast";
import ExportPage from "./Export";
import ImportOnly from "./ImportExport";
import AddLink from "./AddLink";
import Login from "./Login";
import Share from "./Share";
import UpdateBanner from "./UpdateBanner";

// i18n
import { strings, type Lang } from "./i18n";

// Firebase (expects you have ./firebase exporting `auth`)
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

// ===== Types
export type RecordItem = { id: string; name: string; language: string; url: string };

// ===== Tiny hash router
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/browse");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/browse");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash;
}

export default function App() {
  // language + text bundle
  const [lang, setLang] = useState<Lang>("en");
  const t = useMemo(() => strings[lang], [lang]);

  // auth
  const [user, setUser] = useState<User | null>(null);

  // data / selection
  const [data, setData] = useState<RecordItem[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const route = useHashRoute();

  // SW update toast
  const [showUpdate, setShowUpdate] = useState(false);

  // last login (footer fallback)
  const [lastLogin, setLastLogin] = useState<string | undefined>(() =>
    localStorage.getItem("tgn:lastLogin") || undefined
  );

  // ===== AUTH SUBSCRIBE (top-level hook, not inside JSX)
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // store last login time (Pacific, 24h, no seconds)
      try {
        const fmt = new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Los_Angeles",
          hour12: false,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        const parts = fmt.formatToParts(new Date());
        const get = (x: string) => parts.find((p) => p.type === x)?.value || "";
        const stamp = `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
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

  const selectedPairs = data
    .filter((d) => selection.includes(d.id))
    .map(({ name, url }) => ({ name, url }));

  // ===== Login actions
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

  // ===== Page renderer
  function renderPage() {
    if (route.startsWith("#/login")) {
      return (
        <div className="max-w-lg mx-auto">
          <Login lang={lang} setLang={setLang} onSignIn={handleSignIn} onGuest={handleGuest} />
        </div>
      );
    }

    if (route.startsWith("#/add")) {
      return (
        <AddLink
          lang={lang}
          onAdd={(r) => {
            setData((d) => [{ id: crypto.randomUUID(), ...r }, ...d]);
            go("#/browse");
          }}
        />
      );
    }

    if (route.startsWith("#/import")) {
      return (
        <ImportOnly
          lang={lang}
          onBatchAdd={(rows) => {
            setData((d) => [
              ...rows.map((r) => ({
                id: crypto.randomUUID(),
                name: r.name,
                language: r.language,
                url: r.url,
              })),
              ...d,
            ]);
            go("#/browse");
          }}
        />
      );
    }

    if (route.startsWith("#/export")) {
      return <ExportPage lang={lang} data={data} />;
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

              {/* simple Edit/Delete placeholders — wire to Firestore later */}
              <div className="mt-2 flex gap-2">
                <button className="btn btn-white" onClick={() => alert("Edit later (wire Firestore)")}>
                  {t.edit}
                </button>
                <button className="btn btn-white" onClick={() => setData((d) => d.filter((x) => x.id !== r.id))}>
                  {t.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===== RENDER SHELL (topbar -> nav -> main -> footer)
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

            {/* Share (red) */}
            <Share lang={lang} selection={selectedPairs} />

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

      {/* NAV — use i18n labels so EN/TH works */}
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

      {/* MAIN (single renderPage — no duplicate routers) */}
      <main className="content max-w-5xl mx-auto px-4 pb-8">{renderPage()}</main>

      {/* FOOTER (always visible) */}
      <footer className="footer">
        <div className="max-w-5xl mx-auto px-4">
          <UpdateBanner lastLogin={lastLogin} />
        </div>
      </footer>

      {/* UPDATE TOAST */}
      {showUpdate && (
        <UpdateToast
          lang={lang}
          onRefresh={() => {
            (window as any).__tgnUpdateSW?.();
          }}
          onSkip={() => setShowUpdate(false)}
        />
      )}
    </div>
  );
}
