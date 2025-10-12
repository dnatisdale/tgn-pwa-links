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
  // language
  const [lang, setLang] = useState<Lang>("en");
  const i = t(lang);

  // auth
  const [user, setUser] = useState<any>(null);

  // data
  const [rows, setRows] = useState<Row[]>([]);

  // search/filter
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);

  // UI state
  const [textPx, setTextPx] = useState<number>(16);
  const [qrEnlargedId, setQrEnlargedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  // simple hash routing
 // inside component:
const [route, setRoute] = useState<string>(window.location.hash || "#/browse");
const isBrowse = route.startsWith("#/browse");
const isAdd = route.startsWith("#/add");
const isImport = route.startsWith("#/import");
const isExport = route.startsWith("#/export");

  // auth subscribe
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u));
    return () => off();
  }, []);

  // last login stamp (Login.tsx stores tgnLastLoginISO)
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

  // hash change listener
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
      ) {
        return false;
      }
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

  // selection helpers (depend on filtered)
  const allVisibleIds = filtered.map((r) => r.id);
  const selectedRows = filtered.filter((r) => selectedIds.has(r.id));
  const firstSelected = selectedRows[0];
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));

  const selectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of allVisibleIds) next.delete(id);
      } else {
        for (const id of allVisibleIds) next.add(id);
      }
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());
  const toggleSelect = (id: string, on: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const copySelectedLinks = async () => {
    const urls = filtered
      .filter((r) => selectedIds.has(r.id))
      .map((r) => r.url)
      .filter(Boolean);
    if (!urls.length) {
      alert("Select at least one item");
      return;
    }
    try {
      await navigator.clipboard.writeText(urls.join("\n"));
      // optional: alert("Copied");
    } catch {
      alert("Could not copy to clipboard");
    }
  };

  // batch download QR cards (selected)
  const batchDownload = async () => {
    const chosen = filtered.filter((r) => selectedIds.has(r.id));
    if (!chosen.length) {
      alert("Select at least one");
      return;
    }
    const mod = await import("./qrCard");
    for (const r of chosen) {
      await mod.downloadQrCard({
        qrCanvasId: `qr-${r.id}`,
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
          {/* Install (red) */}
          <InstallPWA />

          {/* Share PWA (blue) */}
          <button
            className="btn-blue"
            onClick={() => {
              const shareData = {
                title: "Thai Good News",
                text: "Thai Good News (PWA)",
                url: window.location.origin || window.location.href,
              };
              if (navigator.share) navigator.share(shareData).catch(() => {});
              else {
                navigator.clipboard.writeText(shareData.url).then(
                  () => alert("PWA link copied"),
                  () => alert("Could not copy link")
                );
              }
            }}
          >
            Share PWA
          </button>

          {/* Font-size slider with AAA icon */}
          <span
            title={lang === "th" ? "ขนาดตัวอักษร" : "Text size"}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
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

          {/* Language + Logout */}
          <button className="linklike" onClick={() => setLang(lang === "en" ? "th" : "en")}>
            {lang === "en" ? "ไทย" : "EN"}
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
        <a className="underline" href="#/import">Import</a>
        <a className="underline" href="#/export">Export</a>
        <a className="underline" href="#/about">About</a>
      </nav>

      {/* Main */}
      <main className="p-3 max-w-5xl mx-auto">
        // in the <main> switch:
{isAdd ? (
  <section>
    <h2 className="text-lg font-semibold mb-2">{i.add}</h2>
    <AddLink lang={lang} />
  </section>
) : isImport ? (
  <section>
    <ImportExport lang={lang} />
  </section>
) : isExport ? (
  <section>
    <ExportPage lang={lang} rows={rows} />
  </section>
) : (
  /* …your Browse section… */
)}
        ) : isAbout ? (
          <section>
            {/* simple About content inline if you haven't created About.tsx */}
            <div className="max-w-2xl mx-auto p-3 text-sm space-y-3">
              {lang === "th" ? (
                <>
                  <h2 className="text-lg font-semibold">เกี่ยวกับ Thai Good News</h2>
                  <p>แอปนี้ช่วยรวมลิงก์ข่าวดีและทรัพยากรภาษา (QR & ลิงก์) ให้ใช้งานได้ง่ายบนมือถือ</p>
                  <p>ติดต่อ: ใส่อีเมล/เว็บไซต์ของคุณที่นี่</p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">About Thai Good News</h2>
                  <p>
                    This app collects “good news” links/resources (with QR & direct links) and
                    makes them easy to share on any device.
                  </p>
                  <p>Contact: put your email/website here.</p>
                </>
              )}
            </div>
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

              {/* Bulk actions (aligned + hint under) */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-sm">
                    <button className="linklike" onClick={selectAllVisible}>Select all</button>
                    &nbsp;|&nbsp;
                    <button className="linklike" onClick={clearSelection}>Clear</button>
                    &nbsp;(<span>{selectedRows.length}</span>/<span>{filtered.length}</span>)
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="linklike" onClick={copySelectedLinks}>Copy link</button>
                    <button
                      className="btn-blue"
                      onClick={batchDownload}
                      disabled={!selectedRows.length}
                      title="Download QR cards for selected items"
                    >
                      Download QR cards
                    </button>
                  </div>
                </div>

                {selectedRows.length === 0 && (
                  <div className="hint-under">( Select at least one item )</div>
                )}
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

            {/* Global toolbar with single Share for first selected */}
            <div className="flex flex-wrap items-center gap-8 mb-3">
              <label className="text-sm">
                <input
                  type="checkbox"
                  className="card-check"
                  checked={allSelected}
                  onChange={selectAllVisible}
                />
                &nbsp;Select all ({selectedRows.length}/{filtered.length})
              </label>

              <div>
                <Share
                  url={firstSelected ? firstSelected.url : ""}
                  title={firstSelected ? firstSelected.name || "Link" : ""}
                  qrCanvasId={firstSelected ? `qr-${firstSelected.id}` : undefined}
                />
                {!firstSelected && (
                  <span className="text-xs" style={{ color: "#6b7280", marginLeft: 8 }}>
                    Select at least one item
                  </span>
                )}
              </div>
            </div>

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
                          onChange={(e) => toggleSelect(row.id, e.target.checked)}
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

      {/* Footer */}
      <footer className="footer">
        <div style={{ display: "flex", justifyContent: "center" }}>
          {lastLogin ? `Last login: ${formatPacific(lastLogin)}` : `Last login: ${formatPacific()}`}
        </div>
      </footer>
    </div>
  );
}
