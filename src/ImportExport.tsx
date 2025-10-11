// src/ImportExport.tsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query, writeBatch, doc } from "firebase/firestore";
import { db, auth } from "./firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { t, Lang } from "./i18n";
import { normalizeHttps } from "./utils";

type Row = { id?: string; name: string; language: string; url: string };

// Build-time constants (from vite.config.ts)
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_TIME__: string;

export default function ImportExport({ lang }: { lang: Lang }) {
  const i = t(lang);

  // Existing data (so we can de-dupe imports)
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  // Import state
  const [fileName, setFileName] = useState<string>("");
  const [rawPaste, setRawPaste] = useState<string>("");
  const [preview, setPreview] = useState<Row[]>([]);
  const [previewNote, setPreviewNote] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<string>("");

  // Load existing links (for export + de-dupe)
  useEffect(() => {
    async function load() {
      const user = auth.currentUser;
      if (!user) return;
      const col = collection(db, "users", user.uid, "links");
      const qry = query(col, orderBy("name"));
      const snap = await getDocs(qry);
      const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(list);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      (r.name || "").toLowerCase().includes(needle) ||
      (r.language || "").toLowerCase().includes(needle) ||
      (r.url || "").toLowerCase().includes(needle)
    );
  }, [rows, q]);

  // ---------- IMPORT HELPERS ----------
  function toHttps(u: string): string | null {
    const fixed = normalizeHttps(u?.trim() || "");
    if (!fixed) return null;
    if (!fixed.startsWith("https://")) return null; // enforce https only
    return fixed;
  }

  function parseCSVLike(text: string): Row[] {
    // Accepts CSV or TSV; header optional. Columns: name, language, url
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (!lines.length) return [];

    // Detect delimiter from first non-empty line
    const sample = lines[0];
    const delim = sample.includes("\t") ? "\t" : ",";

    // Handle header
    let startIndex = 0;
    let hasHeader = false;
    const header = sample
      .split(delim)
      .map((s) => s.trim().replace(/^"|"$/g, "").toLowerCase());
    if (header.includes("url") || header.includes("language") || header.includes("name")) {
      hasHeader = true;
      startIndex = 1;
    }

    const out: Row[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const cols = smartSplit(lines[i], delim).map((s) => s.replace(/^"|"$/g, "").trim());
      if (cols.length === 1) {
        // single column → assume it's a URL
        const u = toHttps(cols[0]);
        if (u) out.push({ name: u, language: "", url: u });
        continue;
      }
      const [name = "", language = "", url = ""] = cols;
      const u = toHttps(url);
      if (u) out.push({ name, language, url: u });
    }
    return out;
  }

  function parseJSON(text: string): Row[] {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) return [];
      const out: Row[] = [];
      for (const it of data) {
        const u = toHttps(String(it?.url ?? ""));
        if (!u) continue;
        out.push({
          name: String(it?.name ?? u),
          language: String(it?.language ?? ""),
          url: u,
        });
      }
      return out;
    } catch {
      return [];
    }
  }

  function smartSplit(line: string, delim: string): string[] {
    // minimal CSV/TSV splitter (handles quotes)
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          q = !q;
        }
      } else if (!q && ch === delim) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  function dedupeAgainstExisting(candidates: Row[]): { unique: Row[]; skipped: number } {
    const existing = new Set(rows.map((r) => (r.url || "").trim().toLowerCase()));
    const seen = new Set<string>();
    const unique: Row[] = [];
    let skipped = 0;

    for (const r of candidates) {
      const key = (r.url || "").trim().toLowerCase();
      if (!key) { skipped++; continue; }
      if (existing.has(key)) { skipped++; continue; }
      if (seen.has(key)) { skipped++; continue; }
      seen.add(key);
      unique.push(r);
    }
    return { unique, skipped };
  }

  async function doImport(items: Row[]) {
    if (!items.length) {
      setImportResult("Nothing to import.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setImportResult("Not signed in.");
      return;
    }
    setImporting(true);
    setImportResult("");

    try {
      const batch = writeBatch(db);
      const colPath = `users/${user.uid}/links`;
      for (const r of items) {
        const ref = doc(collection(db, colPath));
        batch.set(ref, {
          name: r.name || r.url,
          language: r.language || "",
          url: r.url,
          createdAt: new Date(),
        });
      }
      await batch.commit();
      setImportResult(`Imported ${items.length} item(s).`);
      setPreview([]);
      setRawPaste("");
      setFileName("");
      // refresh list
      const col = collection(db, "users", user.uid, "links");
      const qry = query(col, orderBy("name"));
      const snap = await getDocs(qry);
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e: any) {
      setImportResult(e?.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  // ---------- IMPORT UI ACTIONS ----------
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();

    let parsed: Row[] = [];
    let note = "";

    if (f.name.toLowerCase().endsWith(".json")) {
      parsed = parseJSON(text);
      note = `Parsed JSON with ${parsed.length} item(s).`;
    } else {
      parsed = parseCSVLike(text);
      note = `Parsed CSV/TSV with ${parsed.length} row(s).`;
    }

    const { unique, skipped } = dedupeAgainstExisting(parsed);
    setPreview(unique);
    setPreviewNote(`${note} Skipped ${skipped} duplicate/invalid url(s).`);
  }

  function onPasteParse() {
    const txt = rawPaste.trim();
    if (!txt) { setPreview([]); setPreviewNote("Nothing to parse."); return; }

    // Try JSON first, then CSV-like
    let parsed = parseJSON(txt);
    let note = "";
    if (parsed.length) {
      note = `Parsed JSON with ${parsed.length} item(s).`;
    } else {
      parsed = parseCSVLike(txt);
      note = `Parsed CSV/TSV/URLs with ${parsed.length} row(s).`;
    }
    const { unique, skipped } = dedupeAgainstExisting(parsed);
    setPreview(unique);
    setPreviewNote(`${note} Skipped ${skipped} duplicate/invalid url(s).`);
  }

  // ---------- EXPORTS (unchanged from your setup) ----------
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

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const title = "Thai Good News — Links";
    const meta = `${__APP_VERSION__} — ${__BUILD_DATE__} ${__BUILD_TIME__}`;
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(title, 40, 40);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(meta, 40, 57);
    const body = filtered.map(r => [r.name ?? "", r.language ?? "", r.url ?? ""]);
    (autoTable as any)(doc, {
      head: [["Name", "Language", "URL"]],
      body,
      startY: 74,
      styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: [15, 36, 84] },
      columnStyles: { 0: { cellWidth: 170 }, 1: { cellWidth: 100 }, 2: { cellWidth: 250 } },
      margin: { left: 40, right: 40 },
      didDrawPage: () => {
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const page = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(`Page ${page}`, pageW - 80, pageH - 20);
      },
    });
    doc.save("thai-good-news-links.pdf");
  };

  const printPage = () => window.print();

  // ---------- RENDER ----------
  return (
    <div className="max-w-5xl mx-auto">
      {/* IMPORT */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Import</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* File import */}
          <div className="border rounded p-3">
            <div className="mb-2 font-semibold">From file (CSV / JSON)</div>
            <input type="file" accept=".csv,.json,text/csv,application/json" onChange={onFile} />
            {fileName && <div className="text-xs mt-1 text-gray-600">Selected: {fileName}</div>}
          </div>

          {/* Paste import */}
          <div className="border rounded p-3">
            <div className="mb-2 font-semibold">From paste (CSV / TSV / URLs)</div>
            <textarea
              className="w-full border rounded p-2 min-h-[120px]"
              placeholder={`Examples:\n\nname,language,url\nJohn,Thai,https://5fish.mobi/A12345\n\nOR just URLs (one per line):\nhttps://5fish.mobi/A12345\nhttps://5fish.mobi/A67890`}
              value={rawPaste}
              onChange={(e) => setRawPaste(e.target.value)}
            />
            <div className="mt-2 flex gap-3">
              <button className="linklike" onClick={onPasteParse}>Parse</button>
              <button className="linklike" onClick={() => { setRawPaste(""); setPreview([]); setPreviewNote(""); }}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {previewNote && <div className="mt-3 text-sm text-gray-600">{previewNote}</div>}
        {!!preview.length && (
          <>
            <div className="mt-3 text-sm">Preview ({preview.length} importable item{preview.length>1?"s":""})</div>
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Language</th>
                  <th className="py-2">URL</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 pr-3">{r.name}</td>
                    <td className="py-2 pr-3">{r.language}</td>
                    <td className="py-2"><a className="underline" href={r.url} target="_blank" rel="noreferrer">{r.url}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 flex items-center gap-3">
              <button className="linklike" onClick={() => doImport(preview)} disabled={importing}>
                {importing ? "Importing…" : "Import N items"}
              </button>
              {importResult && <span className="text-sm text-gray-700">{importResult}</span>}
            </div>
          </>
        )}
      </section>

      {/* EXPORT (unchanged behavior) */}
      <section>
        <h2 className="text-lg font-semibold mb-2">{i.importExport}</h2>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <input
            className="border rounded px-2 py-1 min-w-[260px]"
            placeholder={i.searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="ml-auto flex items-center gap-3 text-sm">
            <button className="linklike" onClick={exportCSV}>Export CSV</button>
            <button className="linklike" onClick={downloadPDF}>Download PDF</button>
            <button className="linklike" onClick={printPage}>Print / PDF</button>
          </span>
        </div>

        {!filtered.length && (
          <div className="text-sm text-gray-600 mb-3">{i.empty}</div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Language</th>
              <th className="py-2">URL</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b">
                <td className="py-2 pr-3">{r.name}</td>
                <td className="py-2 pr-3">{r.language}</td>
                <td className="py-2">
                  <a className="underline" href={r.url} target="_blank" rel="noreferrer">{r.url}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
