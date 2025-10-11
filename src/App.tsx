import React, { useEffect, useMemo, useState } from "react";
import { t, Lang } from "./i18n";
import Login from "./Login";
import QR from "./QR";
import AddLink from "./AddLink";
import ImportExport from "./ImportExport";
import InstallPWA from "./InstallPWA";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import UpdateToast from "./UpdateToast";
import IOSInstallHint from "./IOSInstallHint";
import Share from "./Share";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

// Build-time constants (injected by vite.config.ts)
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

  // rows
  const [rows, setRows] = useState<Row[]>([]);

  // search / filter
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);

  // font size in px (applies to :root --base)
  const [textPx, setTextPx] = useState<number>(16);

  // QR: click-to-enlarge; store which row id is enlarged (or null)
  const [qrEnlargedId, setQrEnlargedId] = useState<string | null>(null);

  // simple hash routing
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

  // CSV export (filtered rows)
  const exportCSV = () => {
    const header = ["name", "language", "url"];
    const lines = [header.join(",")].concat(
      filtered.map((r) =>
        [r.name ?? "", r.language ?? "", r.url ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "thai-good-news-links.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Print / PDF (user can choose "Save as PDF")
  const printPage = () => {
    window.print();
  };
  
// One-click PDF (uses current filtered list)
const downloadPDF = () => {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    // Header title
    const title = "Thai Good News — Links";
    const meta = `${__APP_VERSION__} — ${__BUILD_DATE__} ${__BUILD_TIME__}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(meta, 40, 57);

    // Build table rows from filtered results
    const body = filtered.map(r => [
      r.name ?? "",
      r.language ?? "",
      r.url ?? "",
    ]);

    // Table
    (autoTable as any)(doc, {
      head: [["Name", "Language", "URL"]],
      body,
      startY: 74,
      styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: [15, 36, 84] }, // deep navy
      columnStyles: {
        0: { cellWidth: 170 }, // Name
        1: { cellWidth: 100 }, // Language
        2: { cellWidth: 250 }, // URL
      },
      didDrawPage: (data: any) => {
        // Footer page numbers
        const pageSize = doc.internal.pageSize;
        const pageW = pageSize.getWidth();
        const pageH = pageSize.getHeight();
        const page = (doc as any).getCurrentPageInfo?.().pageNumber ?? doc.getNumberOfPages();
        const total = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(`Page ${page} / ${total}`, pageW - 80, pageH - 20);
      },
      margin: { left: 40, right: 40 },
    });

    doc.save("thai-good-news-links.pdf");
  } catch (e) {
    console.error(e);
    alert("Sorry—couldn’t generate the PDF.");
  }
};

  // small AAA icon
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
          {/* Install (button appears even when prompt isn’t available, with a fallback) */}
          <InstallPWA />

          {/* Font-size slider with AAA icon */}
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
            {/* Search & Filters + Export/Print row */}
            <div className="flex flex-wrap items-center gap-4 mb-3">
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

              <span className="ml-auto flex items-center gap-3 text-sm">
                <button className="linklike" onClick={exportCSV}>Export CSV</button>
                <button className="linklike" onClick={printPage}>Print / PDF</button>
              </span>
            </div>

            {!filtered.length && (
              <div className="text-sm text-gray-600 mb-3">{i.empty}</div>
            )}

            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((row) => {
                const enlarged = qrEnlargedId === row.id;
                const qrSize = enlarged ? 320 : 192;
                return (
                  <li key={row.id} className="card">
                    <div className="text-base font-semibold text-center">{row.name}</div>
                    <div className="text-sm mb-2 text-center">{row.language}</div>

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

                    {/* Unified Share row (Email / LINE / Facebook / X / WhatsApp / Telegram / Copy / Download QR) */}
                    <div className="mt-2">
                      <Share url={row.url} title={row.name || "Link"} qrCanvasId={`qr-${row.id}`} />
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

      {/* Footer with version/date/time */}
      <footer className="footer">
        <div style={{ display: "flex", justifyContent: "center" }}>
          {__APP_VERSION__} — {__BUILD_DATE__} {__BUILD_TIME__}
        </div>
      </footer>
    </div>
  );
}
