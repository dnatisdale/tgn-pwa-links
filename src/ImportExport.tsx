// src/ImportExport.tsx
import React, { useMemo, useState } from "react";
import { t, Lang } from "./i18n";
import { auth, db } from "./firebase";
import {
  collection,
  writeBatch,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import { forceHttps } from "./url";

type RowIn = { name?: string; language?: string; url?: string };
type PreviewItem = {
  name: string;
  language: string;
  urlRaw: string;
  urlHttps: string | null;
  valid: boolean;
  reason?: string;
};

function parseDelimited(text: string, sep: string): RowIn[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const head = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  const idxName = head.findIndex((h) => h === "name");
  const idxLang = head.findIndex((h) => h === "language" || h === "lang");
  const idxUrl = head.findIndex((h) => h === "url");

  const out: RowIn[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep);
    const name = idxName >= 0 ? (cells[idxName] || "").trim() : "";
    const language = idxLang >= 0 ? (cells[idxLang] || "").trim() : "";
    const url = idxUrl >= 0 ? (cells[idxUrl] || "").trim() : "";
    if (!name && !language && !url) continue;
    out.push({ name, language, url });
  }
  return out;
}

function parseJson(text: string): RowIn[] {
  try {
    const obj = JSON.parse(text);
    if (Array.isArray(obj)) return obj as RowIn[];
    if (obj && Array.isArray((obj as any).items)) return (obj as any).items as RowIn[];
    return [];
  } catch {
    return [];
  }
}

export default function ImportExport({ lang }: { lang: Lang }) {
  const i = t(lang);

  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const validItems = useMemo(
    () => preview.filter((p) => p.valid && p.urlHttps),
    [preview]
  );

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setImportMsg("");
    const f = e.target.files?.[0];
    if (!f) return;

    setFileName(f.name);
    const text = await f.text();
    const lower = f.name.toLowerCase();

    let rows: RowIn[] = [];
    if (lower.endsWith(".csv")) rows = parseDelimited(text, ",");
    else if (lower.endsWith(".tsv") || lower.endsWith(".txt")) rows = parseDelimited(text, "\t");
    else if (lower.endsWith(".json")) rows = parseJson(text);
    else {
      rows = parseDelimited(text, ",");
      if (rows.length === 0) rows = parseJson(text);
    }

 -    const pv: PreviewItem[] = rows.map((r) => {
-      const urlHttps = toHttpsOrNull(r.url || "");
-      const valid = !!urlHttps;
-      return {
-        name: (r.name || "").trim(),
-        language: (r.language || "").trim(),
-        urlRaw: r.url || "",
-        urlHttps,
-        valid,
-        reason: valid ? undefined : "URL must be https (or valid domain to coerce)",
-      };
-    });
+    const pv: PreviewItem[] = rows.map((r) => {
+      const raw = (r.url || "").trim();
+      const urlHttps = forceHttps(raw);
+      const valid = !!urlHttps;
+      return {
+        name: (r.name || "").trim(),
+        language: (r.language || "").trim(),
+        urlRaw: raw,
+        urlHttps,
+        valid,
+        reason: valid ? undefined : "Invalid URL (couldn’t coerce to https)",
+      };
+    });

    setPreview(pv);
  }

  async function doImport() {
    setImportMsg("");
    if (!auth.currentUser) {
      setImportMsg("Not signed in.");
      return;
    }
    const uid = auth.currentUser.uid;
    const col = collection(db, "users", uid, "links");

    const items = validItems;
    if (items.length === 0) {
      setImportMsg("Nothing valid to import.");
      return;
    }

    setImporting(true);
    try {
      const CHUNK = 500;
      const batchId = Date.now();
      for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK);
        const batch = writeBatch(db);
        for (const it of chunk) {
          const ref = doc(col);
          batch.set(ref, {
            name: it.name,
            language: it.language,
            url: it.urlHttps,
            createdAt: serverTimestamp(),
            importBatchId: batchId,
          });
        }
        await batch.commit();
      }
      setImportMsg(`Imported ${items.length} item(s).`);
      // Optionally: setPreview([]);
    } catch (e: any) {
      setImportMsg(e.message || String(e));
    } finally {
      setImporting(false);
    }
  }

  function exportCSV() {
    const rows = preview.length ? preview : [];
    const head = ["name", "language", "url"];
    const body = rows.map((r) =>
      [r.name, r.language, r.urlRaw || r.urlHttps || ""]
        .map((v) => `"${(v || "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [head.join(","), ...body].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "links.csv";
    a.click();
  }

  return (
    <div className="max-w-3xl p-3">
      {/* File picker row */}
      <div className="file-row mb-2">
        {/* Red "Choose file" button using hidden input */}
        <label className="btn-red" style={{ cursor: "pointer" }}>
          Choose file
          <input
            type="file"
            accept=".csv,.tsv,.txt,.json,application/json,text/csv"
            onChange={onFile}
            style={{ display: "none" }}
          />
        </label>

        {/* Red pill with formats */}
        <span className="pill-red">(CSV / JSON / TSV)</span>

        {/* Chosen filename */}
        {fileName && (
          <span className="text-sm" style={{ color: "#6b7280" }}>
            {fileName}
          </span>
        )}

        {/* Blue “Add” button appears when a file is chosen */}
        {fileName && (
          <button
            className="btn-blue"
            onClick={doImport}
            disabled={importing || validItems.length === 0}
            title={validItems.length ? `Import ${validItems.length} valid` : "No valid rows"}
          >
            {importing ? "Importing…" : `Add (${validItems.length})`}
          </button>
        )}
      </div>

      {/* Optional export of current preview */}
      <div className="mt-2">
        <button className="linklike" onClick={exportCSV}>
          Export CSV (preview)
        </button>
      </div>

      {/* Status message */}
      {importMsg && <div className="mt-2 text-sm">{importMsg}</div>}

      {/* Preview table */}
      {!!preview.length && (
        <div className="mt-4">
          <div className="text-sm mb-2">
            Preview: {preview.length} row(s) —{" "}
            <span style={{ color: "#059669" }}>{validItems.length} valid</span>,{" "}
            <span style={{ color: "#b91c1c" }}>
              {preview.length - validItems.length} invalid
            </span>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">Valid</th>
                  <th className="border px-2 py-1 text-left">Name</th>
                  <th className="border px-2 py-1 text-left">Language</th>
                  <th className="border px-2 py-1 text-left">URL (raw)</th>
                  <th className="border px-2 py-1 text-left">URL (https)</th>
                  <th className="border px-2 py-1 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{p.valid ? "✓" : "✗"}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">{p.name}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">{p.language}</td>
                    <td className="border px-2 py-1">{p.urlRaw}</td>
                    <td className="border px-2 py-1">{p.urlHttps || ""}</td>
                    <td className="border px-2 py-1 text-red-600">{p.reason || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs mt-1" style={{ color: "#6b7280" }}>
            Tip: if “URL (https)” is empty, we rejected it (http or invalid). Fix your file and re-import.
          </div>
        </div>
      )}
    </div>
  );
}
