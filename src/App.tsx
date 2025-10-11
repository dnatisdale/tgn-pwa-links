import React, { useEffect, useMemo, useState } from "react";
import { t, Lang } from "./i18n";
import Login from "./Login";
import ShareButtons from "./ShareButtons";
import QR from "./QR";
import AddLink from "./AddLink";
import ImportExport from "./ImportExport";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

// Simple row type coming from Firestore
type Row = { id: string; name: string; language: string; url: string };

// Optional: show an app version at the bottom
const APP_VERSION = "v0.3.0";

export default function App() {
  // Language + i18n
  const [lang, setLang] = useState<Lang>("en");
  const i = t(lang);

  // Auth + data
  const [user, setUser] = useState<any>(null);
  const [rows, setRows] = useState<Row[]>([]);

  // UI state
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);
  const [size, setSize] = useState<"s" | "m" | "l">("m");
  const [route, setRoute] = useState<string>(window.location.hash || "#/browse");

  // 1) Auth state
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u));
    return () => off();
  }, []);

  // 2) Subscribe to this user's links
  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    const col = collection(db, "users", user.uid, "links");
    const qry = query(col, orderBy("name"));
    const off = onSnapshot(qry, (snap) => {
      const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(list);
    });
    return () => off();
  }, [user]);

  // 3) Text size (small/medium/large)
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--base",
      size === "s" ? "14px" : size === "m" ? "16px" : "19px"
    );
  }, [size]);

  // 4) Make hash links (#/browse, #/add, #/import) actually switch pages
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/browse");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // 5) Filter + search
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (
        filterThai &&
        r.language?.toLowerCase() !== "thai" &&
        r.language?.toLowerCase() !== "ไทย"
      ) {
        return false;
      }
      if (!needle) return true;
      return (
        (r.name || "").toLowerCase().includes(needle) ||
        (r.language || "").toLowerCase().includes(needle) ||
        (r.url || "").toLowerCase().includes(needle)
      );
    });
    out.sort(
      (a, b) =>
        (a.language || "").localeCompare(b.language || "") ||
        (a.name || "").localeCompare(b.name || "")
    );
    return out;
  }, [rows, q, filterThai]);

  // Not signed in yet → show login
  if (!user) return <Login lang={lang} onLang={setLang} onSignedIn={() => {}} />;

  // Helpers
  const goThai = () => setLang(lang === "en" ? "th" : "en");
  const isBrowse = route.startsWith("#/browse");
  const isAdd = route.startsWith("#/add");
  const isImport = route.startsWith("#/import");

  return (
    <div>
      {/* Header */}
      <header className="header p-3 flex items-center justify-between">
        <div className="font-bold select-none">
          {/* Use your real logo file in /public (e.g., /logo-square-1024.png) */}
          <img className="logo" src="/logo-square.png" alt="logo" /> Thai Good News
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button className="linklike" onClick={goThai}>
            {lang === "en" ? "ไทย" : "EN"}
          </button>
          <div>
            {i.size}:&nbsp;
            <button className="linklike" onClick={() => setSize("s")}>
              {i.small}
            </button>
            &nbsp;|&nbsp;
            <button className="linklike" onClick={() => setSize("m")}>
              {i.medium}
            </button>
            &nbsp;|&nbsp;
            <button className="linklike" onClick={() => setSize("l")}>
              {i.large}
            </button>
          </div>
          <button className="linklike" onClick={() => signOut(auth)}>
            {i.logout}
          </button>
        </div>
      </header>

      {/* Simple nav */}
      <nav className="p-3 flex flex-wrap gap-4 text-sm">
        <a className="underline" href="#/browse">
          {i.browse}
        </a>
        <a className="underline" href="#/add">
          {i.add}
        </a>
        <a className="underline" href="#/import">
          {i.importExport}
        </a>
      </nav>

      {/* Banner only on Browse page.
          IMPORTANT: the file must exist at public/banner-2400x600.png */}
      {isBrowse && (
        <img
          className="banner"
          src="/banner-2400x600.png"
          alt="Thai Good News banner"
        />
      )}

      {/* Main content */}
      <main className="p-3 max-w-5xl mx-auto">
        {isAdd ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">{i.add}</h2>
            <AddLink lang={lang} />
          </section>
        ) : isImport ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">{i.importExport}</h2>
            <ImportExport lang={lang} />
          </section>
        ) : (
          <section>
            {/* Search + filter */}
            <div className="flex flex-wrap gap-4 items-center mb-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={i.searchPlaceholder}
                className="border rounded px-2 py-1 min-w-[260px]"
              />
              <div className="text-sm">
                <button className="linklike" onClick={() => setFilterThai(false)}>
                  {i.filterAll}
                </button>
                &nbsp;|&nbsp;
                <button className="linklike" onClick={() => setFilterThai(true)}>
                  {i.filterThai}
                </button>
              </div>
            </div>

            {/* Empty state */}
            {!filtered.length && (
              <div className="text-sm text-gray-600 mb-3">{i.empty}</div>
            )}

            {/* Link cards */}
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((r) => (
                <li key={r.id} className="card">
                  <div className="text-base font-semibold">{r.name}</div>
                  <div className="text-sm mb-2">{r.language}</div>

                  <QR url={r.url} />

                  <div className="mt-2">
                    <a
                      href={r.url}
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {r.url}
                    </a>
                  </div>

                  <div className="mt-2">
                    <ShareButtons lang={lang} url={r.url} name={r.name} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>


<footer className="footer">
  <div style={{ display: "flex", justifyContent: "center" }}>
    Thai Good News — {__APP_VERSION__} — {__BUILD_DATE__}
  </div>
</footer>
    </div>
  );
}
