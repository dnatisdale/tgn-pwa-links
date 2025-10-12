// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";
import { t, Lang } from "./i18n";
import Login from "./Login";
import QR from "./QR";
import AddLink from "./AddLink";
import ImportExport from "./ImportExport";
import ExportPage from "./Export";
import InstallPWA from "./InstallPWA";
import UpdateToast from "./UpdateToast";
import IOSInstallHint from "./IOSInstallHint";
import Share from "./Share";
import SharePWA from "./SharePWA";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { toHttpsOrNull as toHttps } from "./url";

// Build-time constants (from vite.config.ts)
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_TIME__: string;

type Row = { id: string; name: string; language: string; url: string };

// Small/Big "A" icons for font slider
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

// Format time in Pacific, e.g. "October 12, 2025 — 21:13 PT"
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

export default function App() {
  // language + i18n
  const [lang, setLang] = useState<Lang>("en");
  const i = t(lang);

  // auth
  const [user, setUser] = useState<any>(null);

  // rows and filters
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);

  // UI state
  const [textPx, setTextPx] = useState<number>(16);
  const [qrEnlargedId, setQrEnlargedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  // Routing
  const [route, setRoute] = useState<string>(window.location.hash || "#/browse");
  const isBrowse = route.startsWith("#/browse");
  const isAdd = route.startsWith("#/add");
  const isImport = route.startsWith("#/import");
  const isExport = route.startsWith("#/export");
  const isAbout = route.startsWith("#/about");

// Renders the right page based on the hash route
const renderPage = () => {
  if (isAdd) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-2">{i.add}</h2>
        <AddLink lang={lang} />
      </section>
    );
  }

  if (isImport) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-2">Import</h2>
        <ImportExport lang={lang} />
      </section>
    );
  }

  if (isExport) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-2">Export</h2>
        {/* ExportPage needs rows */}
        <ExportPage lang={lang} rows={rows} />
      </section>
    );
  }

  // ----- BROWSE (default) -----
  return (
    <section>
      {/* Search + language filter */}
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

      {/* Toolbar: select all / copy / download / share */}
      <div className="flex flex-wrap items-center gap-8 mb-3">
        <label className="text-sm">
          <input
            type="checkbox"
            className="card-check"
            checked={
              filtered.length > 0 &&
              filtered.every((r) => selectedIds.has(r.id))
            }
            onChange={() => {
              const allVisibleIds = filtered.map((r) => r.id);
              setSelectedIds((prev) => {
                const next = new Set(prev);
                const allSelected = allVisibleIds.every((id) => next.has(id));
                if (allSelected) {
                  for (const id of allVisibleIds) next.delete(id);
                } else {
                  for (const id of allVisibleIds) next.add(id);
                }
                return next;
              });
            }}
          />
          &nbsp;Select all (
          {filtered.filter((r) => selectedIds.has(r.id)).length}/{filtered.length})
        </label>

        {/* Share for first selected (shows hint when none) */}
        {(() => {
          const selectedRows = filtered.filter((r) => selectedIds.has(r.id));
          const first = selectedRows[0];
          return (
            <div className="flex items-center gap-3">
              <Share
                url={first ? first.url : ""}
                title={first ? first.name || "Link" : ""}
                qrCanvasId={first ? `qr-${first.id}` : undefined}
              />
              {!first && (
                <span className="text-xs" style={{ color: "#6b7280" }}>
                  ( Select at least one item )
                </span>
              )}

              <button
                className="btn btn-blue"
                onClick={async () => {
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
                }}
                disabled={!selectedRows.length}
              >
                Download QR cards ({selectedRows.length})
              </button>

              <button
                className="linklike"
                onClick={async () => {
                  const urls = selectedRows.map((r) => r.url);
                  if (!urls.length) {
                    alert("Select at least one item");
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText(urls.join("\n"));
                    alert("Copied link(s)");
                  } catch {
                    alert("Copy failed");
                  }
                }}
              >
                Copy link
              </button>
            </div>
          );
        })()}
      </div>

      {!filtered.length && (
        <div className="text-sm text-gray-600 mb-3">{i.empty}</div>
      )}

      {/* Cards */}
      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((row) => {
          const enlarged = qrEnlargedId === row.id;
          const qrSize = enlarged ? 320 : 192;
          const checked = selectedIds.has(row.id);
          return (
            <li key={row.id} className="card">
              {/* Checkbox */}
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(row.id)) next.delete(row.id);
                        else next.add(row.id);
                        return next;
                      })
                    }
                    style={{ marginRight: 8 }}
                  />
                  Select
                </label>
              </div>

              <div className="text-base font-semibold text-center">
                {row.name}
              </div>
              <div className="text-sm mb-2 text-center">{row.language}</div>

              {/* Click-to-enlarge QR */}
              <div
                role="button"
                onClick={() => setQrEnlargedId(enlarged ? null : row.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    setQrEnlargedId(enlarged ? null : row.id);
                }}
                tabIndex={0}
                title={
                  enlarged
                    ? lang === "th"
                      ? "ย่อ QR"
                      : "Shrink QR"
                    : lang === "th"
                    ? "ขยาย QR"
                    : "Enlarge QR"
                }
                style={{ cursor: "pointer" }}
              >
                <QR url={row.url} size={qrSize} idForDownload={`qr-${row.id}`} />
              </div>

              <div className="mt-2 text-center">
                <a
                  href={row.url}
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {row.url}
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

  // Auth subscribe
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u));
    return () => off();
  }, []);

  // Last login from localStorage (set in your Login.tsx)
  useEffect(() => {
    const iso = localStorage.getItem("tgnLastLoginISO");
    if (iso) setLastLogin(iso);
  }, []);

  // Data subscribe
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
      // prune selection for removed docs
      setSelectedIds((prev) => {
        const next = new Set<string>();
        for (const id of prev) if (list.find((r) => r.id === id)) next.add(id);
        return next;
      });
    });
    return () => off();
  }, [user]);

  // Apply text size to CSS var
  useEffect(() => {
    document.documentElement.style.setProperty("--base", `${textPx}px`);
  }, [textPx]);

  // Hash routing listener
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/browse");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Filter + search
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

  // Selection derived values
  const allVisibleIds = filtered.map((r) => r.id);
  const selectedRows = filtered.filter((r) => selectedIds.has(r.id));
  const firstSelected = selectedRows[0];
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));

  // Selection helpers
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of allVisibleIds) next.delete(id);
      } else {
        for (const id of allVisibleIds) next.add(id);
      }
      return next;
    });

  const selectAllVisible = () => setSelectedIds(new Set(allVisibleIds));
  const clearSelection = () => setSelectedIds(new Set());

  // Copy selected links
  const copySelectedLinks = async () => {
    const urls = selectedRows.map((r) => r.url).filter(Boolean);
    if (!urls.length) {
      alert("Select at least one item");
      return;
    }
    try {
      await navigator.clipboard.writeText(urls.join("\n"));
      // Optional: alert("Copied links");
    } catch {
      alert("Copy failed");
    }
  };

  // Batch download QR cards
  const batchDownload = async () => {
    if (!selectedRows.length) {
      alert("Select at least one item");
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
  };

  // Edit/Delete per card
  const editRow = async (r: Row) => {
    const name = prompt("Name", r.name ?? "");
    if (name === null) return;
    const language = prompt("Language", r.language ?? "") ?? "";
    const url = prompt("URL (https only)", r.url ?? "");
    if (url === null) return;
    const https = toHttps(url);
    if (!https) {
      alert("Please enter a valid https:// URL");
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
  };

  const deleteRow = async (r: Row) => {
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
  };

  // Gate: not signed in
  if (!user) {
    return <Login lang={lang} onLang={setLang} onSignedIn={() => {}} />;
  }

  // ---- Render ----
  return (
    <div className="app-shell">
      {/* ===== TOP BAR (RIGHT-ALIGNED, ABOVE BANNER) ===== */}
      <div className="topbar">
        {/* Install - red */}
        <div className="install-pwa">
          <InstallPWA className="btn-red" />
        </div>

        {/* Share PWA - blue */}
        <SharePWA className="btn-blue" />

        {/* Font size: small A — slider — big A */}
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

        {/* Language: a / ก */}
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

      {/* ===== MAIN CONTENT ===== */}
      <main className="app-main p-3 max-w-5xl mx-auto">
        {/* Banner */}
        <div className="banner-wrap">
          <img className="banner" src="/banner-2400x600.png" alt="Thai Good News banner" />
        </div>

        {/* Nav */}
        <nav className="p-3 flex flex-wrap gap-4 text-sm">
          <a className="underline" href="#/browse">{i.browse}</a>
          <a className="underline" href="#/add">{i.add}</a>
          <a className="underline" href="#/import">{i.importTitle}</a>
          <a className="underline" href="#/export">{i.exportTitle}</a>
          <a className="underline" href="#/about">About</a>
        </nav>

        {/* Routes */}
        {isAdd ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">{i.add}</h2>
            <AddLink lang={lang} />
          </section>
          {isImport ? (
  <section>
    <h2 className="text-lg font-semibold mb-2">Import</h2>
    <ImportExport lang={lang} />
  </section>
) : /* ...other routes... */ null}

{isExport ? (
  <section>
    <h2 className="text-lg font-semibold mb-2">Export</h2>
    <ExportPage lang={lang} rows={rows} />
  </section>
) : null}

        ) : isAbout ? (
          <section>
            <h2 className="text-lg font-semibold mb-3">About</h2>
            <p className="mb-2">
              Thai Good News helps you browse, share, and print QR links for Thai and English resources.
            </p>
            <p className="text-sm text-gray-600">
              Last login: {lastLogin ? formatPacific(lastLogin) : formatPacific()}
            </p>
          </section>
        ) : (
          // ===== BROWSE =====
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
                <button className="linklike" onClick={() => setFilterThai(false)}>{i.filterAll}</button>
                &nbsp;|&nbsp;
                <button className="linklike" onClick={() => setFilterThai(true)}>{i.filterThai}</button>
              </div>
            </div>

            {/* Global toolbar (select/share/copy/download) */}
            <div className="flex flex-wrap items-center gap-8 mb-3">
              <label className="text-sm">
                <input
                  type="checkbox"
                  className="card-check"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  style={{ marginRight: 6 }}
                />
                Select all ({selectedRows.length}/{filtered.length})
              </label>

              <div className="flex items-center gap-8">
                <div>
                  <Share
                    url={firstSelected ? firstSelected.url : ""}
                    title={firstSelected ? firstSelected.name || "Link" : ""}
                    qrCanvasId={firstSelected ? `qr-${firstSelected.id}` : undefined}
                  />
                  {!firstSelected && (
                    <span className="text-xs" style={{ color: "#6b7280", marginLeft: 8 }}>
                      ( Select at least one item )
                    </span>
                  )}
                </div>

                <button className="btn-blue" onClick={batchDownload} disabled={!selectedRows.length}>
                  Download QR cards ({selectedRows.length})
                </button>

                <button className="linklike" onClick={copySelectedLinks}>
                  Copy link
                </button>
              </div>
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
                    {/* Selection checkbox */}
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          style={{ marginRight: 8 }}
                        />
                        Select
                      </label>
                    </div>

                    <div className="text-base font-semibold text-center">{row.name}</div>
                    <div className="text-sm mb-2 text-center">{row.language}</div>

                    {/* Click-to-enlarge QR */}
                    <div
                      role="button"
                      onClick={() => setQrEnlargedId(enlarged ? null : row.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") setQrEnlargedId(enlarged ? null : row.id); }}
                      tabIndex={0}
                      title={enlarged ? (lang === "th" ? "ย่อ QR" : "Shrink QR") : (lang === "th" ? "ขยาย QR" : "Enlarge QR")}
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

      {/* ===== FOOTER (sticky at bottom, centered) ===== */}
      <footer className="site-footer">
        {__APP_VERSION__} — {__BUILD_DATE__} {__BUILD_TIME__}
      </footer>
    </div>
  );
}
