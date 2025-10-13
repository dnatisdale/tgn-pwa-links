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
// import IOSInstallHint from "./IOSInstallHint"; // optional if you use it
import Share from "./Share";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { toHttpsOrNull as toHttps } from "./url";

declare global { interface Window { __REFRESH_SW__?: () => void } }

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_TIME__: string;

type Row = { id: string; name: string; language: string; url: string };

// (optional) tiny A icons – not hooks, safe to keep outside component
function SmallAIcon() {
  return <span style={{ fontWeight: 700 }}>A</span>;
}
function BigAIcon() {
  return <span style={{ fontWeight: 700, fontSize: 18 }}>A</span>;
}

export default function App() {
  // ===== STATE (hooks must be inside the component!) =====
  const [lang, setLang] = useState<Lang>("en");
  const i = t(lang);

  const [user, setUser] = useState<any>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);

  const [textPx, setTextPx] = useState<number>(16);
  const [qrEnlargedId, setQrEnlargedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  const [route, setRoute] = useState<string>(window.location.hash || "#/browse");
  const isBrowse = route.startsWith("#/browse");
  const isAdd = route.startsWith("#/add");
  const isImport = route.startsWith("#/import");
  const isExport = route.startsWith("#/export");
  const isAbout = route.startsWith("#/about");

  const [showUpdate, setShowUpdate] = useState(false);

  // ===== EFFECTS =====
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);
  useEffect(() => {
    const iso = localStorage.getItem("tgnLastLoginISO");
    if (iso) setLastLogin(iso);
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--base", `${textPx}px`);
  }, [textPx]);
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/browse");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    const onNeed = () => setShowUpdate(true);
    window.addEventListener("pwa:need-refresh", onNeed);
    return () => window.removeEventListener("pwa:need-refresh", onNeed);
  }, []);

  // Firestore subscribe
  useEffect(() => {
    if (!user) { setRows([]); return; }
    const col = collection(db, "users", user.uid, "links");
    const qry = query(col, orderBy("name"));
    const off = onSnapshot(qry, (snap) => {
      const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(list);
      setSelectedIds((prev) => {
        const next = new Set<string>();
        for (const id of prev) if (list.find((r) => r.id === id)) next.add(id);
        return next;
      });
    });
    return () => off();
  }, [user]);

  // ===== DERIVED =====
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

  const allVisibleIds = filtered.map((r) => r.id);
  const selectedRows = filtered.filter((r) => selectedIds.has(r.id));
  const firstSelected = selectedRows[0];
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));

  // ===== HELPERS =====
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
      if (allSelected) for (const id of allVisibleIds) next.delete(id);
      else for (const id of allVisibleIds) next.add(id);
      return next;
    });

  const copySelectedLinks = async () => {
    const urls = selectedRows.map((r) => r.url).filter(Boolean);
    if (!urls.length) { alert("Select at least one item"); return; }
    try { await navigator.clipboard.writeText(urls.join("\n")); } catch { alert("Copy failed"); }
  };

  const batchDownload = async () => {
    if (!selectedRows.length) { alert("Select at least one item"); return; }
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

  const editRow = async (r: Row) => {
    const name = prompt("Name", r.name ?? "");
    if (name === null) return;
    const language = prompt("Language", r.language ?? "") ?? "";
    const url = prompt("URL (https only)", r.url ?? "");
    if (url === null) return;
    const https = toHttps(url);
    if (!https) { alert("Please enter a valid https:// URL"); return; }
    await updateDoc(doc(db, "users", user.uid, "links", r.id), {
      name: name.trim(), language: language.trim(), url: https,
    });
  };

  const deleteRow = async (r: Row) => {
    if (!confirm(`Delete "${r.name || r.url}"?`)) return;
    await deleteDoc(doc(db, "users", user.uid, "links", r.id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(r.id); return n; });
  };

  const updateServiceWorker = (reload: boolean) => {
    window.dispatchEvent(new Event("pwa:refresh"));
    if (reload) location.reload();
  };

  // ===== LOGIN GATE =====
  if (!user) return <Login lang={lang} onLang={setLang} onSignedIn={() => {}} />;

  // ===== RENDER =====
  return (
    <div className="app-shell">
      {/* HEADER (RIGHT-ALIGNED) */}
      <header className="header p-3 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-4 text-sm">
          {/* Install (red) */}
          <InstallPWA className="btn btn-red" label={lang === "th" ? "ติดตั้ง" : "Install"} disabledLabel={lang === "th" ? "ติดตั้ง" : "Install"} />
          {/* Share PWA (blue) */}
          <button
            className="btn btn-blue"
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: "Thai Good News",
                    text: lang === "th" ? "ลองใช้ PWA นี้สิ!" : "Try this PWA!",
                    url: location.href,
                  });
                } else {
                  await navigator.clipboard.writeText(location.href);
                  alert(lang === "th" ? "คัดลอกลิงก์แล้ว" : "Link copied");
                }
              } catch {}
            }}
          >
            {lang === "th" ? "แชร์ PWA" : "Share PWA"}
          </button>

          {/* Font size */}
          <span className="font-size-ctrl" title={lang === "th" ? "ขนาดตัวอักษร" : "Text size"}>
            <SmallAIcon />
            <input
              type="range"
              className="font-size-slider"
              min={14} max={22} step={1}
              value={textPx}
              onChange={(e) => setTextPx(parseInt(e.target.value, 10))}
              aria-label={lang === "th" ? "ขนาดตัวอักษร" : "Text size"}
            />
            <BigAIcon />
          </span>

          {/* Language */}
          <div className="lang-toggle" role="group" aria-label="Language">
            <button className={lang === "en" ? "lgbtn active" : "lgbtn"} onClick={() => setLang("en")}>a</button>
            <button className={lang === "th" ? "lgbtn active" : "lgbtn"} onClick={() => setLang("th")}>ก</button>
          </div>

          {/* Logout */}
          <button className="linklike" onClick={() => signOut(auth)}>{i.logout}</button>
        </div>
      </header>

      {/* MAIN */}
      <main className="p-3 max-w-5xl mx-auto app-main">
        {isAdd ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">{i.add}</h2>
            <AddLink lang={lang} />
          </section>
        ) : isImport ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">Import</h2>
            <ImportExport lang={lang} />
          </section>
        ) : isExport ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">Export</h2>
            <ExportPage lang={lang} rows={rows} />
          </section>
        ) : isAbout ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-sm text-gray-700">Thai Good News — a simple PWA for saving, sharing, and printing QR link cards.</p>
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
                <button className="linklike" onClick={() => setFilterThai(false)}>{i.filterAll}</button>
                &nbsp;|&nbsp;
                <button className="linklike" onClick={() => setFilterThai(true)}>{i.filterThai}</button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-8 mb-3">
              <label className="text-sm">
                <input type="checkbox" className="card-check" checked={allSelected} onChange={toggleSelectAll} />
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

                <button className="btn btn-blue" onClick={batchDownload} disabled={!selectedRows.length}>
                  Download QR cards ({selectedRows.length})
                </button>

                <button className="linklike" onClick={copySelectedLinks}>Copy link</button>
              </div>
            </div>

            {!filtered.length && <div className="text-sm text-gray-600 mb-3">{i.empty}</div>}

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

                    <div
                      role="button"
                      onClick={() => setQrEnlargedId(enlarged ? null : row.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") setQrEnlargedId(enlarged ? null : row.id); }}
                      tabIndex={0}
                      title={enlarged ? (lang === "th" ? "ย่อ QR" : "Shrink QR") : (lang === "th" ? "ขยาย QR" : "Enlarge QR")}
                      style={{ cursor: "pointer" }}
                      className="qr-center"
                    >
                      <QR url={row.url} size={qrSize} idForDownload={`qr-${row.id}`} />
                    </div>

                    <div className="mt-2 text-center">
                      <a href={row.url} className="underline" target="_blank" rel="noreferrer">{row.url}</a>
                    </div>

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

      {/* FOOTER */}
      <footer className="site-footer">
        {lastLogin && <div style={{ marginBottom: 6 }}>Last login: {lastLogin}</div>}
        <div>{__APP_VERSION__} — {__BUILD_DATE__} {__BUILD_TIME__}</div>
      </footer>

      {/* UPDATE TOAST */}
      <UpdateToast
        lang={lang}
        show={showUpdate}
        onRefresh={() => updateServiceWorker(true)}
        onSkip={() => setShowUpdate(false)}
      />
    </div>
  );
}
