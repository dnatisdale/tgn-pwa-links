// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";
import { t, Lang } from "./i18n";
import Login from "./Login";
import QR from "./QR";
import AddLink from "./AddLink";
import SharePWA from "./SharePWA";
import { THAI_RED, THAI_BLUE } from "./ColorTheme";
import ImportExport from "./ImportExport";
import ExportPage from "./Export";
import InstallPWA from "./InstallPWA";
import UpdateToast from "./UpdateToast";
import IOSInstallHint from "./IOSInstallHint";
import Share from "./Share";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { toHttpsOrNull as toHttps } from "./url";

type Row = { id: string; name: string; language: string; url: string };

// ---- helpers ----
function formatPacific(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${dateStr} — ${timeStr} PT`;
}
// --------------

// Build-time constants (optional; injected by vite.config.ts)
declare const __APP_VERSION__: string | undefined;
declare const __BUILD_DATE__: string | undefined;
declare const __BUILD_TIME__: string | undefined;

function SmallAIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 16l2-8h1.5l2 8h-1.5l-.35-1.5H7.85L7.5 16H6zm2.2-3h1.6l-.8-3.3L8.2 13z" fill="currentColor" />
    </svg>
  );
}
function BigAIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M10 18l3-12h2l3 12h-2l-.5-2H12.5l-.5 2h-2zm2.6-4h3l-1.5-6-1.5 6z" fill="currentColor" />
    </svg>
  );
}

export default function App() {
  // language
  const [lang, setLang] = useState<Lang>("en");
  const i = t(lang);

  // auth
  const [user, setUser] = useState<any>(null);

  // data
  const [rows, setRows] = useState<Row[]>([]);

  // UI state
  const [textPx, setTextPx] = useState<number>(16);
  const [qrEnlargedId, setQrEnlargedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  // search/filter
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);

  // hash routing
  const [route, setRoute] = useState<string>(window.location.hash || "#/browse");
  const isBrowse = route.startsWith("#/browse");
  const isAdd = route.startsWith("#/add");
  const isImport = route.startsWith("#/import");
  const isExport = route.startsWith("#/export");
  const isAbout = route.startsWith("#/about");

  // subscribe auth
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u));
    return () => off();
  }, []);

  // last login stamp (Login.tsx should set localStorage 'tgnLastLoginISO' on successful sign-in)
  useEffect(() => {
    const iso = localStorage.getItem("tgnLastLoginISO");
    if (iso) setLastLogin(iso);
  }, []);

  // subscribe data
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
      // prune selection if items were deleted
      setSelectedIds((prev) => {
        const next = new Set<string>();
        for (const id of prev) if (list.find((r) => r.id === id)) next.add(id);
        return next;
      });
    });
    return () => off();
  }, [user]);

  // apply font size to :root var(--base)
  useEffect(() => {
    document.documentElement.style.setProperty("--base", `${textPx}px`);
  }, [textPx]);

  // listen for hash changes
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/browse");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // filter/search
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((row) => {
      if (
        filterThai &&
        row.language?.toLowerCase() !== "thai" &&
        row.language?.toLowerCase() !== "ไทย"
      ) return false;
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

  // selection helpers (MUST be after `filtered`)
  const allVisibleIds = filtered.map((r) => r.id);
  const selectedRows = filtered.filter((r) => selectedIds.has(r.id));
  const firstSelected = selectedRows[0];
  const allSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of allVisibleIds) next.delete(id);
      } else {
        for (const id of allVisibleIds) next.add(id);
      }
      return next;
    });
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }
  async function copySelectedLinks() {
    const urls = selectedRows.map((r) => r.url).filter(Boolean);
    if (!urls.length) {
      alert("Select at least one item");
      return;
    }
    try {
      await navigator.clipboard.writeText(urls.join("\n"));
    } catch {
      alert("Copy failed");
    }
  }
  async function batchDownload() {
    if (!selectedRows.length) {
      alert("Select at least one");
      return;
    }
    const mod = await import("./qrCard");
    for (const r of selectedRows) {
      await mod.downloadQrCard({
        qrCanvasId: `qr-${r.id}`,
        url: r.url,
        name: r.name,
        title: "Thai Good News",
      });
    }
  }

  // per-card edit/delete
  async function editRow(r: Row) {
    const name = prompt("Name", r.name ?? "");
    if (name === null) return;
    const language = prompt("Language", r.language ?? "") ?? "";
    const url = prompt("URL", r.url ?? "");
    if (url === null) return;
    const https = toHttps(url);
    if (!https) {
      alert("Only https:// URLs are allowed.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.uid, "links", r.id), {
        name: name.trim(),
        language: language.trim(),
        url: https,
      });
    } catch (e: any) {
      alert(e.message || String(e));
    }
  }
  async function deleteRow(r: Row) {
    if (!confirm(`Delete "${r.name || r.url}"?`)) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "links", r.id));
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(r.id);
        return n;
      });
    } catch (e: any) {
      alert(e.message || String(e));
    }
  }

  // Share PWA button
  async function sharePWA() {
    const shareData = {
      title: "Thai Good News",
      text: "Curated links for Thai & English readers.",
      url: window.location.origin,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user canceled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied");
      } catch {
        alert("Share not supported");
      }
    }
  }

  // small AAA icon for font size
  const AAA = (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0f2454" />
      <path
        d="M6 16l2.2-8h1.6L12 16h-1.6l-.4-1.6H8l-.4 1.6H6zm2.3-3h1.7l-.9-3.7L8.3 13zM13 16l2.2-8h1.6L19 16h-1.6l-.4-1.6h-2.1L14.6 16H13zm2.3-3h1.7l-.9-3.7-.8 3.7z"
        fill="#fff"
      />
    </svg>
  );

  // not signed in
  if (!user) {
    return <Login lang={lang} onLang={setLang} onSignedIn={() => {}} />;
  }

  return (
    <div>
      {/* Banner */}
      <div className="banner-wrap">
        <img className="banner" src="/banner-2400x600.png" alt="Thai Good News banner" />
      </div>

      {/* Header */}
     <div className="flex items-center gap-3 text-sm">
  {/* Install button (unchanged) */}
  <InstallPWA />

  {/* Font size control: small A — slider — big A */}
  <span className="font-size-ctrl" title={lang === "th" ? "ขนาดตัวอักษร" : "Text size"}>
    <SmallAIcon />
    <input
      type="range"
      min={14}
      max={22}
      step={1}
      value={textPx}
      onChange={(e) => setTextPx(parseInt(e.target.value, 10))}
      aria-label={lang === "th" ? "ขนาดตัวอักษร" : "Text size"}
      className="font-size-slider"
    />
    <BigAIcon />
  </span>

  {/* Language toggle: a / ก */}
  <div className="lang-toggle" aria-label="Language">
    <button
      className={lang === "en" ? "lgbtn active" : "lgbtn"}
      onClick={() => setLang("en")}
      title="English"
      aria-label="English"
    >
      a
    </button>
    <button
      className={lang === "th" ? "lgbtn active" : "lgbtn"}
      onClick={() => setLang("th")}
      title="ไทย"
      aria-label="Thai"
    >
      ก
    </button>
  </div>

  {/* Logout */}
  <button className="linklike" onClick={() => signOut(auth)}>
    {i.logout}
  </button>
</div>

      {/* Hidden real install component (kept for functionality) */}
      <div style={{ display: "none" }}>
        {/* InstallPWA should listen to a click on #tgn-install-trigger or show its own UI in your older layout */}
        <button id="tgn-install-trigger" />
        <InstallPWA />
      </div>

      {/* Nav */}
      <nav className="p-3 flex flex-wrap gap-4 text-sm">
        <a className="underline" href="#/browse">{i.browse}</a>
        <a className="underline" href="#/add">{i.add}</a>
        <a className="underline" href="#/import">{i.importExport}</a>
        <a className="underline" href="#/export">Export</a>
        <a className="underline" href="#/about">About</a>
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
            <h2 className="text-lg font-semibold mb-2">
              {lang === "th" ? "นำเข้า" : "Import"}
            </h2>
            <ImportExport lang={lang} />
          </section>
        ) : isExport ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">
              {lang === "th" ? "ส่งออก" : "Export"}
            </h2>
            <ExportPage lang={lang} rows={rows} />
          </section>
        ) : isAbout ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">{lang === "th" ? "เกี่ยวกับ" : "About"}</h2>
            <p className="mb-2">
              {lang === "th"
                ? "แอปนี้รวบรวมลิงก์ข่าวสารภาษาไทยและอังกฤษ ใช้งานได้แบบ PWA"
                : "This PWA curates Thai & English news/links for quick access."}
            </p>
            <p className="text-sm text-gray-600">
              {typeof __APP_VERSION__ !== "undefined" && __APP_VERSION__
                ? `v${__APP_VERSION__} — ${__BUILD_DATE__ ?? ""} ${__BUILD_TIME__ ?? ""}`
                : ""}
            </p>
          </section>
        ) : (
          // Browse
          <section>
            {/* Search + Filter */}
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

            {/* Global toolbar */}
            <div className="flex flex-wrap items-center gap-8 mb-4">
              <div className="text-sm">
                <button className="linklike" onClick={toggleSelectAll}>
                  {allSelected ? (lang === "th" ? "ยกเลิกเลือกทั้งหมด" : "Unselect all") : (lang === "th" ? "เลือกทั้งหมด" : "Select all")}
                </button>
                &nbsp;|&nbsp;
                <button className="linklike" onClick={clearSelection}>
                  {lang === "th" ? "ล้างการเลือก" : "Clear"}
                </button>
                <span className="text-xs" style={{ color: "#6b7280", marginLeft: 8 }}>
                  ({selectedRows.length}/{filtered.length})
                </span>
              </div>

              {/* One Share (first selected) */}
              <div className="flex items-center gap-3">
                <Share
                  url={firstSelected ? firstSelected.url : ""}
                  title={firstSelected ? firstSelected.name || "Link" : ""}
                  qrCanvasId={firstSelected ? `qr-${firstSelected.id}` : undefined}
                  variant="red" // make it red in your Share.tsx if you support variants
                />
                {!firstSelected && (
                  <span className="text-xs" style={{ color: "#6b7280" }}>
                    ( {lang === "th" ? "เลือกอย่างน้อยหนึ่งรายการ" : "Select at least one item"} )
                  </span>
                )}
              </div>

              {/* Friends: Copy + Download */}
              <button className="linklike" onClick={copySelectedLinks}>
                {lang === "th" ? "คัดลอกลิงก์" : "Copy link"}
              </button>

              <button className="btn-blue" onClick={batchDownload} disabled={!selectedRows.length}>
                {lang === "th" ? "ดาวน์โหลดการ์ด QR" : "Download QR cards"} ({selectedRows.length})
              </button>
            </div>

            {!filtered.length && (
              <div className="text-sm text-gray-600 mb-3">{i.empty}</div>
            )}

            {/* Cards */}
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((row) => {
                const enlarged = qrEnlargedId === row.id;
                const qrSize = enlarged ? 320 : 192;
                return (
                  <li key={row.id} className="card">
                    {/* Selection */}
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          style={{ marginRight: 8 }}
                        />
                        {lang === "th" ? "เลือก" : "Select"}
                      </label>
                    </div>

                    <div className="text-base font-semibold text-center">{row.name}</div>
                    <div className="text-sm mb-2 text-center">{row.language}</div>

                    {/* Click-to-enlarge QR */}
                    <div
                      role="button"
                      onClick={() => setQrEnlargedId(enlarged ? null : row.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setQrEnlargedId(enlarged ? null : row.id);
                      }}
                      tabIndex={0}
                      title={
                        enlarged
                          ? lang === "th" ? "ย่อ QR" : "Shrink QR"
                          : lang === "th" ? "ขยาย QR" : "Enlarge QR"
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <QR url={row.url} size={qrSize} idForDownload={`qr-${row.id}`} />
                    </div>

                    <div className="mt-2 text-center">
                      <a href={row.url} className="underline" target="_blank" rel="noreferrer">
                        {row.url}
                      </a>
                    </div>

                    {/* Per-card actions */}
                    <div className="mt-2 flex justify-center gap-6 text-sm">
                      <button className="linklike" onClick={() => editRow(row)}>
                        {lang === "th" ? "แก้ไข" : "Edit"}
                      </button>
                      <button className="linklike" onClick={() => deleteRow(row)}>
                        {lang === "th" ? "ลบ" : "Delete"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>

      {/* Toasts + iOS hint */}
      <UpdateToast />
      <IOSInstallHint />

      {/* Footer */}
      <footer className="footer">
        <div style={{ display: "flex", justifyContent: "center" }}>
          {lastLogin
            ? `Last login: ${formatPacific(lastLogin)}`
            : `Last login: ${formatPacific()}`}
        </div>
      </footer>
    </div>
  );
}
