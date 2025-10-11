import React, { useEffect, useMemo, useState } from "react";
import { t, Lang } from "./i18n";
import Login from "./Login";
import QR from "./QR";
import AddLink from "./AddLink";
import ImportExport from "./ImportExport";
import InstallPWA from "./InstallPWA";
import UpdateToast from "./UpdateToast";
import IOSInstallHint from "./IOSInstallHint";
import Share from "./Share";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

// Build-time constants injected by Vite (vite.config.ts)
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

  // Firestore data
  const [rows, setRows] = useState<Row[]>([]);

  // search / filter
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);

  // font size (px) slider
  const [textPx, setTextPx] = useState<number>(16);

  // QR size (px) slider
  const [qrPx, setQrPx] = useState<number>(192);

  // simple hash route
  const [route, setRoute] = useState<string>(window.location.hash || "#/browse");

  // auth subscribe
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u));
    return () => off();
  }, []);

  // data subscribe (user links)
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

  // apply font size to :root --base so all text scales
  useEffect(() => {
    document.documentElement.style.setProperty("--base", `${textPx}px`);
  }, [textPx]);

  // hash-change listener
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

  return (
    <div>
      {/* Banner */}
      <div className="banner-wrap">
        <img className="banner" src="/banner-2400x600.png" alt="Thai Good News banner" />
      </div>

      {/* Header controls */}
      <header className="header p-3 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-4 text-sm">
          {/* Install (shows only when installable) */}
          <InstallPWA />

          {/* Font size slider + small “AAA” icon */}
          <span
            title={lang === "th" ? "ขนาดตัวอักษร" : "Text size"}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <rect x="2" y="2" width="20" height="20" rx="4" fill="#0f2454"></rect>
              <path
                d="M6 16l2.2-8h1.6L12 16h-1.6l-.4-1.6H8l-.4 1.6H6zm2.3-3h1.7l-.9-3.7L8.3 13zM13 16l2.2-8h1.6L19 16h-1.6l-.4-1.6h-2.1L14.6 16H13zm2.3-3h1.7l-.9-3.7-.8 3.7z"
                fill="#fff"
              />
            </svg>
            <input
              type="range"
              min={14}
              max={22}
              step={1}
              value={textPx}
              onChange={(e) => setTextPx(parseInt(e.target.value, 10))}
              aria-label={lang === "th" ? "ขนาดตัวอักษร" : "Text size"}
              style={{ width: 110 }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>{textPx}px</span>
          </span>

          {/* QR size slider */}
          <label className="sr-only" htmlFor="qrSizePx">
            QR size
          </label>
          <input
            id="qrSize
