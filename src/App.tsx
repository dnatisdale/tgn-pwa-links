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
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { toHttpsOrNull as toHttps } from "./url";

type Row = { id: string; name: string; language: string; url: string };

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
  // language + strings
  const [lang, setLang] = useState<Lang>("en");
  const i = t(lang);

  // auth
  const [user, setUser] = useState<any>(null);

  // data
  const [rows, setRows] = useState<Row[]>([]);

  // search/filter
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);

  // UI
  const [textPx, setTextPx] = useState<number>(16);
  const [qrEnlargedId, setQrEnlargedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  // routing
  const [route, setRoute] = useState<string>(window.location.hash || "#/browse");
  const isBrowse = route.startsWith("#/browse");
  const isAdd = route.startsWith("#/add");
  const isImport = route.startsWith("#/import");
  const isExport = route.startsWith("#/export");
  const isAbout = route.startsWith("#/about");

  // auth subscribe
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u));
    return () => off();
  }, []);

  // last login stamp
  useEffect(() => {
    const iso = localStorage.getItem("tgnLastLoginISO");
    if (iso) setLastLogin(iso);
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
      // prune selection for removed docs
      setSelectedIds((prev) => {
        const next = new Set<string>();
        for (const id of prev) if (list.find((r) => r.id === id)) next.add(id);
        return next;
      });
    });
    return () => off();
  }, [user]);

  // apply text size
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

  // selection helpers (defined AFTER state)
  const allVisibleIds = filtered.map((r) => r.id);
  const selectedRows = filtered.filter((r) => selectedIds.has(r.id));
  const firstSelected = selectedRows[0];
  const allSelected =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));

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

  // actions
  const batchDownload = async () => {
    if (!selectedRows.length) {
      alert(i.selectAtLeastOnePlain);
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

  const copySelectedLinks = async () => {
    const urls = filtered
      .filter((r) => selectedIds.has(r.id))
      .map((r) => r.url)
      .filter(Boolean);
    if (!urls.length) {
      try {
        await navigator.clipboard.writeText("");
      } catch {}
      alert(i.selectAtLeastOnePlain);
      return;
    }
    try {
      await navigator.clipboard.writeText(urls.join("\n"));
    } catch {
      alert("Could not copy to clipboard");
    }
  };

  const editRow = async (r: Row) => {
    const name = prompt("Name", r.name ?? "");
    if (name === null) return;
    const language = prompt("Language", r.language ?? "") ?? "";
    const url = prompt("URL", r.url ?? "");
    if (url === null) return;
    const https = toHttps(url) ?? url; // allow both with/without https
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

  // auth gate
  if (!user) {
    return <Login lang={lang} onLang={setLang} onSignedIn={() => {}} />;
  }

  return (
    <div className="app-shell">
      {/* top-right utility bar */}
      <div className="topbar">
        {/* Install (red), Share PWA (blue), font size, language toggle, logout */}
        <div className="flex items-center gap-2">
          <InstallPWA />
          {/* Share PWA button could be in your Share component or a simple navigator.share */}
          <button
            className="btn-blue"
            onClick={async () => {
              try {
                if ((navigator as any).share) {
                  await (navigator as any).share({
                    title: "Thai Good News",
                    text: "Check out Thai Good News",
                    url: window.location.origin,
                  });
                } else {
                  await navigator.clipboard.writeText(window.location.origin);
                  alert("PWA link copied");
                }
              } catch {}
            }}
          >
            Share PWA
          </button>

          {/* font size control: small A — slider — big A */}
          <span className="font-size-ctrl">
            <span aria-hidden>A</span>
            <input
              className="font-size-slider"
              type="range"
              min={14}
              max={22}
              step={1}
              value={textPx}
              onChange={(e) => setTextPx(parseInt(e.target.value, 10))}
              aria-label={lang === "th" ? "ขนาดตัวอักษร" : "Text size"}
            />
            <span style={{ fontSize: 18 }} aria-hidden>
              A
            </span>
          </span>

          {/* language toggle “a / ก” */}
          <div className="lang-toggle" role="group" aria-label="Language">
            <button
              className={`lgbtn ${lang === "en" ? "active" : ""}`}
              onClick={() => setLang("en")}
              type="button"
            >
              a
            </button>
            <button
              className={`lgbtn ${lang === "th" ? "active" : ""}`}
              onClick={() => setLang("th")}
              type="button"
            >
              ก
            </button>
          </div>

          <button className="linklike" onClick={() => signOut(auth)}>
            {i.logout}
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="banner-wrap">
        <img className="banner" src="/banner-2400x600.png" alt="Thai Good News banner" />
      </div>

      {/* Nav */}
      <nav className="p-3 flex flex-wrap gap-4 text-sm">
        <a className="underline" href="#/browse">
          {i.browse}
        </a>
        <a className="underline" href="#/add">
          {i.add}
        </a>
        <a className="underline" href="#/import">
          {i.importLabel}
        </a>
        <a className="underline" href="#/export">
          {i.exportLabel}
        </a>
        <a className="underline" href="#/about">
          About
        </a>
      </nav>

      {/* Main */}
      <main className="app-main p-3 max-w-5xl mx-auto">
        {isAdd ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">{i.add}</h2>
            <AddLink lang={lang} />
          </section>
        ) : isImport ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">{i.importLabel}</h2>
            <ImportExport lang={lang} />
          </section>
        ) : isExport ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">{i.exportLabel}</h2>
            <ExportPage lang={lang} rows={rows} />
          </section>
        ) : isAbout ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p>Thai Good News — simple PWA for sharing links and QR.</p>
          </section>
        ) : (
          /* Browse */
          <section>
            {/* Search + filter */}
            <div className="flex flex-wrap gap-4 items-center mb-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={i.searchPlaceholder}
                className="border rounded px-2 py-1 min-w-[260px]"
              />

              {/* Filter */}
              <div className="text-sm">
                <button className="linklike" onClick={() => setFilterThai(false)}>
                  {i.filterAll}
                </button>
                &nbsp;|&nbsp;
                <button className="linklike" onClick={() => setFilterThai(true)}>
                  {i.filterThai}
                </button>
              </div>

              {/* Bulk selection row */}
              <div className="flex flex-wrap items-center gap-8">
                <div className="text-sm">
                  <button className="linklike" onClick={selectAllVisible}>
                    Select all
                  </button>
                  &nbsp;|&nbsp;
                  <button className="linklike" onClick={clearSelection}>
                    Clear
                  </button>
                </div>

                <div className="toolbar-row">
                  <button className="linklike" onClick={copySelectedLinks}>
                    {i.copyLink}
                  </button>

                  <button
                    className={`btn-blue ${!selectedRows.length ? "btn-disabled" : ""}`}
                    onClick={batchDownload}
                    disabled={!selectedRows.length}
                  >
                    Download QR cards ({selectedRows.length})
                  </button>

                  {!selectedRows.length && (
                    <span className="inline-hint">{i.selectAtLeastOneInline}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Global toolbar (checkbox + Share for first selected) */}
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

              <div className="flex items-center gap-8">
                <div>
                  <Share
                    url={firstSelected ? firstSelected.url : ""}
                    title={firstSelected ? firstSelected.name || "Link" : ""}
                    qrCanvasId={firstSelected ? `qr-${firstSelected.id}` : undefined}
                  />
                  {!firstSelected && (
                    <span className="text-xs" style={{ color: "#6b7280", marginLeft: 8 }}>
                      {i.selectAtLeastOneInline}
                    </span>
                  )}
                </div>

                <button
                  className={`btn-blue ${!selectedRows.length ? "btn-disabled" : ""}`}
                  onClick={batchDownload}
                  disabled={!selectedRows.length}
                >
                  Download QR cards ({selectedRows.length})
                </button>

                <button className="linklike" onClick={copySelectedLinks}>
                  {i.copyLink}
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
                const checked = selectedIds.has(row.id);
                return (
                  <li key={row.id} className="card">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(row.id)}
                          style={{ marginRight: 8 }}
                        />
                        Select
                      </label>
                    </div>

                    <div className="text-base font-semibold text-center">{row.name}</div>

                    {/* Click-to-enlarge QR */}
                    <div
                      role="button"
                      onClick={() => setQrEnlargedId(enlarged ? null : row.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setQrEnlargedId(enlarged ? null : row.id);
                      }}
                      tabIndex={0}
                      title={enlarged ? "Shrink QR" : "Enlarge QR"}
                      style={{ cursor: "pointer" }}
                      className="qr-center"
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
                        Edit
                      </button>
                      <button className="linklike" onClick={() => deleteRow(row)}>
                        Delete
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

      {/* Footer (pinned) */}
      <footer className="site-footer">
        <div style={{ display: "flex", justifyContent: "center" }}>
          {lastLogin
            ? `Last login: ${formatPacific(lastLogin)}`
            : `Last login: ${formatPacific()}`}
        </div>
      </footer>
    </div>
  );
}
