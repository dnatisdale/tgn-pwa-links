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
  // i18n
  const [lang, setLang] = useState<Lang>("en");
  const i = t(lang);

  // auth
  const [user, setUser] = useState<any>(null);

  // data
  const [rows, setRows] = useState<Row[]>([]);

  // UI state
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);
  const [textPx, setTextPx] = useState<number>(16);
  const [qrEnlargedId, setQrEnlargedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  // simple hash routing
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

  // last login stamp from Login.tsx
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
      // prune selection for removed docs
      setSelectedIds((prev) => {
        const next = new Set<string>();
        for (const id of prev) if (list.find((r) => r.id === id)) next.add(id);
        return next;
      });
    });
    return () => off();
  }, [user]);

  // apply base text size
  useEffect(() => {
    document.documentElement.style.setProperty("--base", `${textPx}px`);
  }, [textPx]);

  // router
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/browse");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
  const saved = localStorage.getItem("lang") as Lang | null;
  if (saved) setLang(saved);
  else setLang(navigator.language.startsWith("th") ? "th" : "en");
}, []);
useEffect(() => { localStorage.setItem("lang", lang); }, [lang]);

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

  // gate: login
  if (!user) {
    return <Login lang={lang} onLang={setLang} onSignedIn={() => {}} />;
  }

  // --- Selection helpers (declare BEFORE JSX uses them) ---
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

  const clearSelection = () => setSelectedIds(new Set());

  const copySelectedLinks = async () => {
    const urls = selectedRows.map((r) => r.url).filter(Boolean);
    if (!urls.length) {
      alert("Select at least one item");
      return;
    }
    try {
      await navigator.clipboard.writeText(urls.join("\n"));
      alert("Copied links");
    } catch {
      alert("Copy failed");
    }
  };

  // batch download QR cards (selected)
  const batchDownload = async () => {
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
  };

  // per-card edit/delete (https only)
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

  // AAA icon
  const AAA = (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0f2454" />
      <path
        d="M6 16l2.2-8h1.6L12 16h-1.6l-.4-1.6H8l-.4 1.6H6zm2.3-3h1.7l-.9-3.7L8.3 13zM13 16l2.2-8h1.6L19 16h-1.6l-.4-1.6h-2.1L14.6 16H13zm2.3-3h1.7l-.9-3.7-.8 3.7z"
        fill="#fff"
      />
    </svg>
  );

  // --------- page switcher (avoid nested crazy ternaries) ----------
  let page: React.ReactNode;

  if (isAdd) {
    page = (
      <section>
        <h2 className="text-lg font-semibold mb-2">{i.add}</h2>
        <AddLink lang={lang} />
      </section>
    );
  } else if (isImport) {
    page = (
      <section>
        <h2 className="text-lg font-semibold mb-2">{i.importExport /* title without /Export */}</h2>
        <ImportExport lang={lang} />
      </section>
    );
  } else if (isExport) {
    page = (
      <section>
        {/* Export page already says “Export” inside; not “Import/Export” */}
        <ExportPage lang={lang} />
      </section>
    );
  } else if (isAbout) {
    page = (
      <section className="prose max-w-2xl">
        <h2>About</h2>
        <p>Thai Good News — shareable links with QR codes for Thai &amp; English audiences.</p>
        <p>
          Need Thai strings polished? I can help translate / localize the labels
          and messages—just send me your preferred wording.
        </p>
      </section>
    );
  } else {
    // Browse
    page = (
      <section>
        {/* Search + filter */}
        <div className="flex flex-wrap gap-4 items-center mb-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={i.searchPlaceholder}
            className="border rounded px-2 py-1 min-w-[260px]"
          />

          {/* bulk select helpers */}
          <div className="text-sm">
            <button className="linklike" onClick={toggleSelectAll}>
              {allSelected ? "Clear all" : "Select all"}
            </button>
            &nbsp;|&nbsp;
            <button className="linklike" onClick={clearSelection}>Clear</button>
          </div>

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

        {/* Global toolbar (Share + Copy + Download) */}
        <div className="flex flex-wrap items-center gap-8 mb-3">
          {/* Share (first selected) */}
          <div className="flex items-center gap-2">
            <Share
              url={firstSelected ? firstSelected.url : ""}
              title={firstSelected ? firstSelected.name || "Link" : ""}
              qrCanvasId={firstSelected ? `qr-${firstSelected.id}` : undefined}
            />
            {!firstSelected && (
              <span className="hint-under">( Select at least one item )</span>
            )}
          </div>

          {/* Copy links + hint */}
          <div className="flex items-center gap-2">
            <button className="linklike" onClick={copySelectedLinks}>Copy link</button>
            {selectedRows.length === 0 && (
              <div className="hint-under">( Select at least one item )</div>
            )}
          </div>

          {/* Download QR cards */}
          <button
            className="btn-blue"
            onClick={batchDownload}
            disabled={!selectedRows.length}
            title="Download QR card images for selected items"
          >
            Download QR cards ({selectedRows.length})
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
            const checked = selectedIds.has(row.id);
            return (
              <li key={row.id} className="card">
                {/* Selection checkbox */}
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
                <div className="text-sm mb-2 text-center">{row.language}</div>

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
    );
  }

  // header AAA icon
  const AAAIcon = (
    <span
      title={lang === "th" ? "ขนาดตัวอักษร" : "Text size"}
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      {(
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#0f2454" />
          <path
            d="M6 16l2.2-8h1.6L12 16h-1.6l-.4-1.6H8l-.4 1.6H6zm2.3-3h1.7l-.9-3.7L8.3 13zM13 16l2.2-8h1.6L19 16h-1.6l-.4-1.6h-2.1L14.6 16H13zm2.3-3h1.7l-.9-3.7-.8 3.7z"
            fill="#fff"
          />
        </svg>
      )}
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
          {/* Red Install and Blue Share PWA buttons (styled via your CSS utility classes) */}
          <button className="btn-red">
            <InstallPWA />
          </button>
          <a className="btn-blue" href={location.origin} target="_blank" rel="noreferrer">
            Share PWA
          </a>

          {AAAIcon}

          {/* Language + Logout */}
          <button className="linklike" onClick={() => setLang(lang === "en" ? "th" : "en")}>
            {lang === "EN" || lang === "en" ? "ไทย" : "EN"}
          </button>
          <button className="linklike" onClick={() => signOut(auth)}>
            {i.logout}
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="p-3 flex flex-wrap gap-4 text-sm">
        <a className="underline" href="#/browse">{i.browse}</a>
        <a className="underline" href="#/add">{i.add}</a>
        <a className="underline" href="#/import">{i.importExport}</a>
        <a className="underline" href="#/export">Export</a>
        <a className="underline" href="#/about">About</a>
      </nav>

      {/* Main */}
      <main className="p-3 max-w-5xl mx-auto">{page}</main>

      {/* Toasts + iOS hint */}
      <UpdateToast />
      <IOSInstallHint />

      {/* Footer */}
      <footer className="footer">
        <div style={{ display: "flex", justifyContent: "center" }}>
          {lastLogin ? `Last login: ${formatPacific(lastLogin)}` : `Last login: ${formatPacific()}`}
        </div>
      </footer>
    </div>
  );
}
