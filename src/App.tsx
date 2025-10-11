import React, { useEffect, useMemo, useState } from "react";
import { t, Lang } from "./i18n";
import Login from "./Login";
import QR from "./QR";
import AddLink from "./AddLink";
import ImportExport from "./ImportExport";
import InstallPWA from "./InstallPWA";
import UpdateToast from "./UpdateToast";
import IOSInstallHint from "./IOSInstallHint";
import Share from "./Share"; // unified share
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

// Build-time constants (from vite.config)
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_TIME__: string;

type Row = { id: string; name: string; language: string; url: string };

export default function App() {
  // language
  const [lang, setLang] = useState<Lang>("en");
  const i = t(lang);

  // auth
  const [user, setUser] = useState<any>(null);

  // data
  const [rows, setRows] = useState<Row[]>([]);

  // search / filter
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);

  // text size (S/M/L)
  const [textSize, setTextSize] = useState<"s" | "m" | "l">("m");

  // QR size: slider (px)
  const [qrPx, setQrPx] = useState<number>(192);

  // simple hash router
  const [route, setRoute] = useState<string>(window.location.hash || "#/browse");

  // auth subscribe
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u));
    return () => off();
  }, []);

  // data subscribe
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

  // apply text size to :root --base
  useEffect(() => {
    const px = textSize === "s" ? "14px" : textSize === "m" ? "16px" : "19px";
    document.documentElement.style.setProperty("--base", px);
  }, [textSize]);

  // hash router listener
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/browse");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // filter + search
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((row) => {
      if (
        filterThai &&
        row.language?.toLowerCase() !== "thai" &&
        row.language?.toLowerCase() !== "ไทย"
      )
        return false;
      if (!needle) return true;
      return (
        (row.name || "").toLowerCase().includes(needle) ||
        (row.language || "").toLowerCase().includes(needle) ||
        (row.url || "").toLowerCase().includes(needle)
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

  // glyphs for text-size dropdown
  const glyph = lang === "th" ? "ก" : "A";

  return (
    <div>
      {/* Banner */}
      <div className="banner-wrap">
        <img className="banner" src="/banner-2400x600.png" alt="Thai Good News banner" />
      </div>

      {/* Header (right side controls only) */}
      <header className="header p-3 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-4 text-sm">
          {/* Install with icon (shows only when installable) */}
          <InstallPWA />

          {/* Text size (S/M/L) */}
          <label className="sr-only" htmlFor="textSize">Text size</label>
          <select
            id="textSize"
            value={textSize}
            onChange={(e) => setTextSize(e.target.value as "s" | "m" | "l")}
            aria-label={lang === "th" ? "ขนาดตัวอักษร" : "Text size"}
            style={{ padding: "2px 6px", borderRadius: 6, border: "1px solid #e5e7eb" }}
          >
            <option value="s">{glyph} (S)</option>
            <option value="m">{glyph} (M)</option>
            <option value="l">{glyph} (L)</option>
          </select>

          {/* QR size slider */}
          <label className="sr-only" htmlFor="qrSizePx">QR size</label>
          <input
            id="qrSizePx"
            type="range"
            min={128}
            max={320}
            step={16}
            value={qrPx}
            onChange={(e) => setQrPx(parseInt(e.target.value, 10))}
            aria-label={lang === "th" ? "ขนาดคิวอาร์โค้ด" : "QR size"}
            style={{ width: 120, verticalAlign: "middle" }}
          />
          <span style={{ fontSize: 12, color: "#6b7280" }}>{qrPx}px</span>

          {/* Language toggle + Logout */}
          <button className="linklike" onClick={() => setLang(lang === "en" ? "th" : "en")}>
            {lang === "en" ? "ไทย" : "EN"}
          </button>
          <button className="linklike" onClick={() => signOut(auth)}>{i.logout}</button>
        </div>
      </header>

      {/* Nav */}
      <nav className="p-3 flex flex-wrap gap-4 text-sm">
        <a className="underline" href="#/browse">{i.browse}</a>
        <a className="underline" href="#/add">{i.add}</a>
        <a className="underline" href="#/import">{i.importExport}</a>
      </nav>

      {/* Main */}
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
              {filtered.map((row) => (
                <li key={row.id} className="card">
                  <div className="text-base font-semibold text-center">{row.name}</div>
                  <div className="text-sm mb-2 text-center">{row.language}</div>

                  {/* Scalable QR */}
                  <QR url={row.url} size={qrPx} idForDownload={`qr-${row.id}`} />

                  <div className="mt-2 text-center">
                    <a href={row.url} className="underline" target="_blank" rel="noreferrer">
                      {row.url}
                    </a>
                  </div>

                  {/* Unified Share (URL-only, plus optional Download QR) */}
                  <div className="mt-2">
                    <Share url={row.url} title={row.name || "Link"} qrCanvasId={`qr-${row.id}`} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Toasts + iOS hint */}
      <UpdateToast />
      <IOSInstallHint />

      {/* Footer (centered version/date/time) */}
      <footer className="footer">
        <div style={{ display: "flex", justifyContent: "center" }}>
          {__APP_VERSION__} — {__BUILD_DATE__} {__BUILD_TIME__}
        </div>
      </footer>
    </div>
  );
}
