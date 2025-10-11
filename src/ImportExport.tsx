// src/ImportExport.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection, getDocs, orderBy, query, writeBatch, doc, where
} from "firebase/firestore";
import { db, auth } from "./firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { t, Lang } from "./i18n";
import { normalizeHttps } from "./utils";

type Row = { id?: string; name: string; language: string; url: string };

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_TIME__: string;

const LAST_BATCH_KEY = "tgn:lastImportBatchId";

export default function ImportExport({ lang }: { lang: Lang }) {
  const i = t(lang);

  // Current data (for export + de-dup)
  const [rows, setRows] = useState<Row[]>([]);
  // Export filter (applies to export table only)
  const [exportFilter, setExportFilter] = useState("");

  // Import state
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<Row[]>([]);
  const [skipNote, setSkipNote] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [rawPaste, setRawPaste] = useState("");

  const [lastBatchId, setLastBatchId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(LAST_BATCH_KEY) : null
  );
  const [undoMsg, setUndoMsg] = useState("");

  // Load existing items once
  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) return;
      const col = collection(db, "users", user.uid, "links");
      const qry = query(col, orderBy("name"));
      const snap = await getDocs(qry);
      setRows(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    })();
  }, []);

  // ---------- helpers ----------
  function toHttps(u: string): string | null {
    const fixed = normalizeHttps(u?.trim() || "");
    if (!fixed) return null;
    if (!fixed.startsWith("https://")) return null;
    return fixed;
  }

  function smartSplit(line: string, delim: string): string[] {
    const out: string[] = []; let cur = ""; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++; }
        else { q = !q; }
      } else if (!q && ch === delim) { out.push(cur); cur = ""; }
      else { cur += ch; }
    }
    out.push(cur); return out;
  }

  function parseCSVLike(text: string): Row[] {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const sample = lines[0];
    const delim = sample.includes("\t") ? "\t" : ",";

    let idx = 0;
    const header = sample.split(delim).map(s => s.trim().replace(/^"|"$/g, "").toLowerCase());
    if (header.includes("url") || header.includes("language") || header.includes("name")) idx = 1;

    const out: Row[] = [];
    for (let i = idx; i < lines.length; i++) {
      const cols = smartSplit(lines[i], delim).map(s => s.replace(/^"|"$/g, "").trim());
      if (cols.length === 1) {
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
        out.push({ name: String(it?.name ?? u), language: String(it?.language ?? ""), url: u });
      }
      return out;
    } catch { return []; }
  }

  function dedupe(candidates: Row[]) {
    const existing = new Set(rows.map(r => (r.url || "").trim().toLowerCase()));
    const seen = new Set<string>();
    const unique: Row[] = [];
    let skipped = 0;
    for (const r of candidates) {
      const key = (r.url || "").trim().toLowerCase();
      if (!key) { skipped++; continue; }
      if (existing.has(key)) { skipped++; continue; }
      if (seen.has(key)) { skipped++; continue; }
      seen.add(key); unique.push(r);
    }
    return { unique, skipped };
  }

  async function refreshRows() {
    const user = auth.currentUser;
    if (!user) return;
    const col = collection(db, "users", user.uid, "links");
    const qry = query(col, orderBy("name"));
    const snap = await getDocs(qry);
    setRows(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  }

  // ---------- import actions ----------
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();
    let parsed: Row[] = f.name.toLowerCase().endsWith(".json")
      ? parseJSON(text)
      : parseCSVLike(text);
    const { unique, skipped } = dedupe(parsed);
    setPreview(unique);
    setSkipNote(skipped ? `Skipped ${skipped} duplicate/invalid URL(s).` : "");
    setImportMsg("");
  }

  function parsePaste() {
    const txt = rawPaste.trim();
    if (!txt) { setPreview([]); setSkipNote("Nothing to parse."); return; }
    let parsed = parseJSON(txt);
    if (!parsed.length) parsed = parseCSVLike(txt);
    const { unique, skipped } = dedupe(parsed);
    setPreview(unique);
    setSkipNote(skipped ? `Skipped ${skipped} duplicate/invalid URL(s).` : "");
    setImportMsg("");
  }

  async function doImport() {
    if (!preview.length) { setImportMsg("Nothing to import."); return; }
    const user = auth.currentUser;
    if (!user) { setImportMsg("Not signed in."); return; }
    setImporting(true); setImportMsg("");

    const batchId = String(Date.now());
    try {
      const batch = writeBatch(db);
      const colPath = `users/${user.uid}/links`;
      for (const r of preview) {
        const ref = doc(collection(db, colPath));
        batch.set(ref, {
          name: r.name || r.url,
          language: r.language || "",
          url: r.url,
          createdAt: new Date(),
          importBatchId: batchId,
        });
      }
      await batch.commit();
      localStorage.setItem(LAST_BATCH_KEY, batchId);
      setLastBatchId(batchId);

      setImportMsg(`Imported ${preview.length} item(s).`);
      setPreview([]); setFileName(""); setRawPaste(""); setSkipNote("");
      await refreshRows();
    } catch (e: any) {
      setImportMsg(e?.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function undoLastImport() {
    setUndoMsg("");
    const user = auth.currentUser;
    if (!user) { setUndoMsg("Not signed in."); return; }
    const id = lastBatchId;
    if (!id) { setUndoMsg("No import to undo."); return; }

    try {
      const col = collection(db, "users", user.uid, "links");
      const qry = query(col, where("importBatchId", "==", id));
      const snap = await getDocs(qry);
      if (snap.empty) {
        setUndoMsg("No rows found for last import.");
        localStorage.removeItem(LAST_BATCH_KEY); setLastBatchId(null);
        return;
      }
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      localStorage.removeItem(LAST_BATCH_KEY); setLastBatchId(null);
      setUndoMsg(`Undo complete: removed ${snap.size} item(s).`);
      await refreshRows();
    } catch (e: any) {
      setUndoMsg(e?.message || "Undo failed (index may be required for importBatchId).");
    }
  }

  function downloadSampleCSV() {
    const sample = [
      "name,language,url",
      "Five Fish (Thai),Thai,https://5fish.mobi/A62808",
      "Bible App (Thai),Thai,https://www.bible.com/th",
      "Example,,https://example.org/path"
    ].join("\n");
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sample-links.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---------- export helpers ----------
  const exportFiltered = useMemo(() => {
    const needle = exportFilter.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(r =>
      (r.name || "").toLowerCase().includes(needle) ||
      (r.language || "").toLowerCase().includes(needle) ||
      (r.url || "").toLowerCase().includes(needle)
    );
  }, [rows, exportFilter]);

  function exportCSV() {
    const header = ["name", "language", "url"];
    const lines = [header.join(",")].concat(
      exportFiltered.map(r =>
        [r.name ?? "", r.language ?? "", r.url ?? ""]
          .map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "thai-good-news-links.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadPDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const title = "Thai Good News — Links";
    const meta = `${__APP_VERSION__} — ${__BUILD_DATE__} ${__BUILD_TIME__}`;
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(title, 40, 40);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(meta, 40, 57);
    const body = exportFiltered.map(r => [r.name ?? "", r.language ?? "", r.url ?? ""]);
    (autoTable as any)(doc, {
      head: [["Name", "Language", "URL"]],
      body,
      startY: 74,
      styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: [15, 36, 84] },
      columnStyles: { 0: { cellWidth: 170 }, 1: { cellWidth: 100 }, 2: { cellWidth: 250 } },
      margin: { left: 40, right: 40 },
    });
    doc.save("thai-good-news-links.pdf");
  }

  const printPage = () => window.print();

  // ---------- UI ----------
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">Import</h2>

      {/* top action row */}
      <div className="flex items-center gap-3 mb-3 text-sm">
        <button className="linklike" onClick={downloadSampleCSV}>Download sample CSV</button>
        <span className="ml-auto flex items-center gap-3">
          {lastBatchId && (
            <>
              <span className="text-xs text-gray-500">Last batch: {lastBatchId}</span>
              <button className="linklike" onClick={undoLastImport}>Undo last import</button>
              {undoMsg && <span className="text-sm text-gray-700">{undoMsg}</span>}
            </>
          )}
        </span>
      </div>

      {/* Import panel */}
      <div className="border rounded p-3 mb-4">
<div className="mb-1">
  <span>Choose a file</span>{" "}
  <span className="text-xs" style={{ color: "#6b7280" }}>(CSV TSV JSON)</span>
</div>
<input
  type="file"
  accept=".csv,.json,text/csv,application/json"
  onChange={onFile}
/>

        {fileName && <div className="text-xs mt-1 text-gray-600">Selected: {fileName}</div>}

        <div className="mt-3">
          <button className="linklike" onClick={() => setShowPaste(v => !v)}>
            {showPaste ? "Hide paste import" : "Paste instead"}
          </button>
          {showPaste && (
            <div className="mt-2">
              <textarea
                className="w-full border rounded p-2 min-h-[120px]"
                placeholder={`CSV/TSV or JSON or one URL per line`}
                value={rawPaste}
                onChange={(e) => setRawPaste(e.target.value)}
              />
              <div className="mt-2">
                <button className="linklike" onClick={parsePaste}>Parse paste</button>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {skipNote && <div className="mt-3 text-sm text-gray-600">{skipNote}</div>}
        {!!preview.length && (
          <>
            <div className="mt-3 text-sm">Preview ({preview.length} item{preview.length>1?"s":""})</div>
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
                    <td className="py-2">
                      <a className="underline" href={r.url} target="_blank" rel="noreferrer">{r.url}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

<div className="mt-3 flex items-center gap-3">
  <button
    className="linklike"
    onClick={async () => {
      console.log("[Import] preview size:", preview.length);
      await doImport();
      console.log("[Import] done");
    }}
    disabled={importing}
  >
    {importing ? "Importing…" : `Import ${preview.length} item(s)`}
  </button>
  {importMsg && <span className="text-sm text-gray-700">{importMsg}</span>}
</div>

          </>
        )}

        {!preview.length && !fileName && !showPaste && (
          <div className="text-sm text-gray-500 mt-2">Nothing to parse yet.</div>
        )}
      </div>

      {/* Export section */}
      <h2 className="text-lg font-semibold mb-2">{i.importExport}</h2>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          className="border rounded px-2 py-1 min-w-[260px]"
          placeholder="Filter export list…"
          value={exportFilter}
          onChange={(e) => setExportFilter(e.target.value)}
        />
        <span className="ml-auto flex items-center gap-3 text-sm">
          <button className="linklike" onClick={exportCSV}>Export CSV</button>
          <button className="linklike" onClick={downloadPDF}>Download PDF</button>
          <button className="linklike" onClick={printPage}>Print / PDF</button>
        </span>
      </div>

      {!exportFiltered.length && (
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
          {exportFiltered.map(r => (
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

      <div className="text-xs text-gray-500 mt-3">
        Showing {exportFiltered.length} of {rows.length}
      </div>
    </div>
  );
}
