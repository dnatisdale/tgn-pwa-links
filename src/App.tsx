// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";
import { t, Lang } from "./i18n";
import Login from "./Login";
import ExportPage from "./Export";
import QR from "./QR";
import AddLink from "./AddLink";
import DownloadQRButton from "./DownloadQRButton";
import ImportExport from "./ImportExport";
import InstallPWA from "./InstallPWA";
import UpdateToast from "./UpdateToast";
import IOSInstallHint from "./IOSInstallHint";
import Share from "./Share"; // single dropdown component
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection, onSnapshot, orderBy, query,
  doc, deleteDoc, updateDoc
} from "firebase/firestore";
import { toHttpsOrNull } from "./url";

// Build-time constants (optional)
declare const __APP_VERSION__: string | undefined;
declare const __BUILD_DATE__: string | undefined;
declare const __BUILD_TIME__: string | undefined;

type Row = { id: string; name: string; language: string; url: string };

function formatPacific(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  const isExport = route.startsWith("#/export");
  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "long", day: "numeric",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", hour12: false, hour: "2-digit", minute: "2-digit",
  }).format(date);
  return `${dateStr} — ${timeStr} PT`;
}

export default function App() {
  // language
  const [lang, setLang] = useState<Lang>("en");
  const i = t(lang);

  // auth
  const [user, setUser] = useState<any>(null);

  // rows
  const [rows, setRows] = useState<Row[]>([]);

  // search / filter
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);

  // font size in px
  const [textPx, setTextPx] = useState<number>(16);

  // QR click-to-enlarge
  const [qrEnlargedId, setQrEnlargedId] = useState<string | null>(null);

  // selection (per card) + select-all
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // simple hash routing
  const [route, setRoute] = useState<string>(window.location.hash || "#/browse");

  // last login in footer
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u));
    return () => off();
  }, []);

  useEffect(() => {
    const iso = localStorage.getItem("tgnLastLoginISO");
    if (iso) setLastLogin(iso);
  }, []);

  // subscribe to user links
  useEffect(() => {
    if (!user) { setRows([]); return; }
    const col = collection(db, "users", user.uid, "links");
    const qry = query(col, orderBy("name"));
    const off = onSnapshot(qry, (snap) => {
      const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(list);
      // Drop selections that vanished
      setSelectedIds(prev => {
        const next = new Set<string>();
        for (const id of prev) if (list.find(r => r.id === id)) next.add(id);
        return next;
      });
    });
    return () => off();
  }, [user]);

  // apply font size
  useEffect(() => {
    document.documentElement.style.setProperty("--base", `${textPx}px`);
  }, [textPx]);

  // hash change
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/browse");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // filtered list
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

  if (!user) {
    return <Login lang={lang} onLang={setLang} onSignedIn={() => {}} />;
  }

  const isBrowse = route.startsWith("#/browse");
  const isAdd = route.startsWith("#/add");
  const isImport = route.startsWith("#/import");

  // selection helpers
  const allVisibleIds = filtered.map(r => r.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        // unselect all visible
        for (const id of allVisibleIds) next.delete(id);
      } else {
        // select all visible
        for (const id of allVisibleIds) next.add(id);
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedRows = filtered.filter(r => selectedIds.has(r.id));

  // top toolbar actions
  const firstSelected = selectedRows[0];
  const selectedUrls = selectedRows.map(r => r.url);

  // batch download QR cards
  const batchDownload = async () => {
    if (!selectedRows.length) { alert("Select at least one"); return; }
    for (const r of selectedRows) {
      const canvasId = `qr-${r.id}`;
      // use the single-card helper
      (await import("./qrCard")).downloadQrCard({
        qrCanvasId: canvasId,
        url: r.url,
        name: r.name,
        title: "Thai Good News",
      });
    }
  };

  // per-card edit/delete
  const editRow = async (r: Row) => {
    const name = prompt("Name", r.name ?? "");
    if (name === null) return;
    const language = prompt("Language", r.language ?? "") ?? "";
    const url = prompt("URL (https only)", r.url ?? "");
    if (url === null) return;
    const https = toHttpsOrNull(url);
    if (!https) { alert("Please enter a valid https:// URL"); return; }
    try {
      await updateDoc(doc(db, "users", user.uid, "links", r.id), {
        name: name.trim(),
        language: language.trim(),
        url: https,
      });
    } catch (e: any) {
      alert(e.message || String(e));
    }
  };

  const deleteRow = async (r: Row) => {
    if (!confirm(`Delete "${r.name || r.url}"?`)) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "links", r.id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(r.id); return n; });
    } catch (e: any) {
      alert(e.message || String(e));
    }
  };

  // small AAA icon for text size
  const AAA = (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0f2454" />
      <path
        d="M6 16l2.2-8h1.6L12 16h-1.6l-.4-1.6H8l-.4 1.6H6zm2.3-3h1.7l-.9-3.7L8.3 13zM13 16l2.2-8h1.6L19 16h-1.6l-.4-1.6h-2.1L14.6 16H13zm2.3-3h1.7l-.9-3.7-.8 3.7z"
        fill="#fff"
      />
    </svg>
  );

  return (
    <div>
      {/* Banner */}
      <div className="banner-wrap">
        <img className="banner" src="/banner-2400x600.png" alt="Thai Good News banner" />
      </div>

      {/* Header */}
      <header className="header p-3 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-4 text-sm">
          <InstallPWA />
          <span title={lang === "th" ? "ขนาดตัวอักษร" : "Text size"} style={{display:"inline-flex",alignItems:"center",gap:6}}>
            {AAA}
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
  <a className="underline" href="#/export">Export</a>   {/* <-- add this */}
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
            {/* Search + Thai filter */}
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

            {/* Global toolbar: Select all + Share + Download */}
            <div className="flex flex-wrap items-center gap-10 mb-3">
              <label className="text-sm">
                <input
                  type="checkbox"
                  className="card-check"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
                Select all ({selectedRows.length}/{filtered.length})
              </label>

              {/* One Share dropdown for the FIRST selected item; plus copy-all fallback */}
              <div className="flex items-center gap-8">
                <div>
                  <Share
                    url={firstSelected ? firstSelected.url : ""}
                    title={firstSelected ? firstSelected.name || "Link" : ""}
                  />
                  {!firstSelected && (
                    <span className="text-xs" style={{ color: "#6b7280", marginLeft: 8 }}>
                      Select at least one item
                    </span>
                  )}
                </div>

                <button className="btn-blue" onClick={batchDownload} disabled={!selectedRows.length}>
                  Download QR cards ({selectedRows.length})
                </button>

                <button
                  className="linklike"
                  onClick={async () => {
                    if (!selectedUrls.length) { alert("Select at least one"); return; }
                    try {
                      await navigator.clipboard.writeText(selectedUrls.join("\n"));
                      alert("All selected links copied");
                    } catch { alert("Copy failed"); }
                  }}
                >
                  Copy all links
                </button>
              </div>
            </div>

            {!filtered.length && (
              <div className="text-sm text-gray-600 mb-3">{i.empty}</div>
            )}

            {/* Grid of cards */}
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((row) => {
                const enlarged = qrEnlargedId === row.id;
                const qrSize = enlarged ? 320 : 192;
                const checked = selectedIds.has(row.id);
                return (
                  <li key={row.id} className="card">
                    {/* Row header: checkbox + name */}
                    <div className="flex items-center justify-between mb-1">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="card-check"
                          checked={checked}
                          onChange={() => toggleSelect(row.id)}
                        />
                        <span className="text-base font-semibold">{row.name}</span>
                      </label>
                      <div className="text-xs text-gray-600">{row.language}</div>
                    </div>

{isAdd ? (
  /* ... */
) : isImport ? (
  /* ... */
) : isExport ? (
  <section>
    <ExportPage lang={lang} />
  </section>
) : (
  /* browse section ... */
)}


                    {/* Click-to-enlarge QR */}
                    <div
                      role="button"
                      onClick={() => setQrEnlargedId(enlarged ? null : row.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") setQrEnlargedId(enlarged ? null : row.id); }}
                      tabIndex={0}
                      title={enlarged ? (lang==="th" ? "ย่อ QR" : "Shrink QR") : (lang==="th" ? "ขยาย QR" : "Enlarge QR")}
                      style={{ cursor: "pointer" }}
                    >
                      <QR url={row.url} size={qrSize} idForDownload={`qr-${row.id}`} />
                    </div>

                    <div className="mt-2 text-center">
                      <a href={row.url} className="underline" target="_blank" rel="noreferrer">
                        {row.url}
                      </a>
                    </div>

                    {/* Per-card actions (Edit/Delete) */}
                    <div className="mt-2 flex justify-center gap-6 text-sm">
                      <button className="linklike" onClick={() => editRow(row)}>Edit</button>
                      <button className="linklike" onClick={() => deleteRow(row)}>Delete</button>
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

      {/* Footer: Last login (PT) */}
      <footer className="footer">
        <div style={{ display: "flex", justifyContent: "center" }}>
          {lastLogin ? `Last login: ${formatPacific(lastLogin)}` : `Last login: ${formatPacific()}`}
        </div>
      </footer>
    </div>
  );
}
