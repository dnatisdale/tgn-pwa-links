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

// Build-time constants from vite.config.ts
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_TIME__: string;

type Row = { id: string; name: string; language: string; url: string };

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const i = t(lang);
  const [user, setUser] = useState<any>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);
  const [size, setSize] = useState<"s" | "m" | "l">("m");
  const [route, setRoute] = useState<string>(window.location.hash || "#/browse");

  // auth
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u));
    return () => off();
  }, []);

  // data
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

  // text size
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--base",
      size === "s" ? "14px" : size === "m" ? "16px" : "19px"
    );
  }, [size]);

  // hash router
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/browse");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // filter + search
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (
        filterThai &&
        r.language?.toLowerCase() !== "thai" &&
        r.language?.toLowerCase() !== "ไทย"
      )
        return false;
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

  if (!user) return <Login lang={lang} onLang={setLang} onSignedIn={() => {}} />;

  const isBrowse = route.startsWith("#/browse");
  const isAdd = route.startsWith("#/add");
  const isImport = route.startsWith("#/import");

  return (
    <div>
      {/* Banner on top (from public/) + thin dark line under it */}
      <div className="banner-wrap">
        <img className="banner" src="/banner-2400x600.png" alt="Thai Good News banner" />
      </div>

      {/* Minimal header (no title, no logo) */}
      <header className="header p-3 flex items-center justify-between">
        <div /> {/* empty left to keep spacing minimal and clean */}
        <div className="flex items-center gap-4 text-sm">
          <button className="linklike" onClick={() => setLang(lang === "en" ? "th" : "en")}>
            {lang === "en" ? "ไทย" : "EN"}
          </button>
          <div>
            {i.size}:&nbsp;
            <button className="linklike" onClick={() => setSize("s")}>{i.small}</button>
            &nbsp;|&nbsp;
            <button className="linklike" onClick={() => setSize("m")}>{i.medium}</button>
            &nbsp;|&nbsp;
            <button className="linklike" onClick={() => setSize("l")}>{i.large}</button>
          </div>
          <button className="linklike" onClick={() => signOut(auth)}>{i.logout}</button>
        </div>
      </header>

      {/* nav */}
      <nav className="p-3 flex flex-wrap gap-4 text-sm">
        <a className="underline" href="#/browse">{i.browse}</a>
        <a className="underline" href="#/add">{i.add}</a>
        <a className="underline" href="#/import">{i.importExport}</a>
      </nav>

      {/* main */}
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
            <div className="flex flex-wrap gap-4 items-center mb-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={i.searchPlaceholder}
                className="border rounded px-2 py-1 min-w-[260px]"
              />
              <div className="text-sm">
                <button className="linklike" onClick={() => setFilterThai(false)}>{i.filterAll}</button>
                &nbsp;|&nbsp;
                <button className="linklike" onClick={() => setFilterThai(true)}>{i.filterThai}</button>
              </div>
            </div>

            {!filtered.length && (
              <div className="text-sm text-gray-600 mb-3">{i.empty}</div>
            )}

            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((r) => (
                <li key={r.id} className="card">
  <div className="text-base font-semibold text-center">{r.name}</div>
  <div className="text-sm mb-2 text-center">{r.language}</div>

  {/* Centered QR */}
  <div className="qr-block">
    <QR url={r.url} />
  </div>

  <div className="mt-2 text-center">
    <a href={r.url} className="underline" target="_blank" rel="noreferrer">
      {r.url}
    </a>
  </div>

  {/* Centered share row */}
  <div className="mt-2 share-block">
    <ShareButtons lang={lang} url={r.url} name={r.name} />
  </div>
</li>

              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Centered version/date/time */}
      <footer className="footer">
        <div style={{ display: "flex", justifyContent: "center" }}>
          {__APP_VERSION__} — {__BUILD_DATE__} {__BUILD_TIME__}
        </div>
      </footer>
    </div>
  );
}
