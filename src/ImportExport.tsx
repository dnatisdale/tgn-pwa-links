// src/ImportExport.tsx
import React, { useMemo, useState } from "react";
import { Lang, t } from "./i18n";
import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { forceHttps } from "./url";

type PreviewItem = {
  name: string;
  language: string;
  urlRaw: string;
  urlHttps: string | null;
  valid: boolean;
  reason?: string;
};

export default function ImportExport({ lang }: { lang: Lang }) {
  const i = t(lang);

  // file + preview state
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [kindLabel, setKindLabel] = useState<"CSV" | "TSV" | "JSON" | "">("");
  const [importMsg, setImportMsg] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);

  // --- UI strings ---
  const labelChoose = lang === "th" ? "เลือกไฟล์" : "Choose a file";
  const labelAdd = lang === "th" ? "เพิ่ม" : "Add";
  const tipCoerce =
    lang === "th"
      ? "เราจะแก้ URL ที่ขาด http/https หรือเป็น http ให้เป็น https ถ้า “URL (https)” ยังว่าง แสดงว่าไม่ถูกต้อง"
      : "We auto-fix missing/http schemes to https. If “URL (https)” is empty, it was still invalid.";

  // --- file handler ---
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImportMsg("");
    const file = e.target.files?.[0];
    if (!file) {
      setPreview([]);
      setKindLabel("");
      return;
    }
    const text = await file.text();
    const ext = file.name.toLowerCase().split(".").pop() || "";

    // Try to detect kind
    if (ext === "json" || looksLikeJSON(text)) {
      setKindLabel("JSON");
      const rows = parseJSON(text);
      setPreview(toPreview(rows));
      return;
    }

    // CSV / TSV
    if (ext === "tsv" || looksLikeTSV(text)) {
      setKindLabel("TSV");
      const rows = parseDelimited(text, "\t");
      setPreview(toPreview(rows));
      return;
    }

    // default CSV
    setKindLabel("CSV");
    const rows = parseDelimited(text, ",");
    setPreview(toPreview(rows));
  }

  // --- import ---
  async function doImport() {
    setImportMsg("");
    if (!auth.currentUser) {
      setImportMsg("Not signed in.");
      return;
    }
    const validItems = preview.filter((p) => p.valid && p.urlHttps);
    if (!validItems.length) {
      setImportMsg("No valid rows to import.");
      return;
    }

    setImporting(true);
    try {
      const col = collection(db, "users", auth.currentUser.uid, "links");
      let ok = 0;
      for (const item of validItems) {
        const https = forceHttps(item.urlRaw); // re-validate
        if (!https) continue;
        await addDoc(col, {
          name: item.name,
          language: item.language,
          url: https,
          createdAt: serverTimestamp(),
        });
        ok++;
      }
      setImportMsg(`Imported ${ok} item(s).`);
    } catch (e: any) {
      setImportMsg(e.message || String(e));
    } finally {
      setImporting(false);
    }
  }

  // --- helpers ---
  function looksLikeJSON(s: string) {
    const x = s.trim();
    return (x.startsWith("{") && x.endsWith("}")) || (x.startsWith("[") && x.endsWith("]"));
  }
  function looksLikeTSV(s: string) {
    // a quick heuristic: more tabs than commas in first lines
    const first = s.split(/\r?\n/).slice(0, 3).join("\n");
    const tabs = (first.match(/\t/g) || []).length;
    const commas = (first.match(/,/g) || []).length;
    return tabs > commas;
  }

  type RawRow = { name?: string; language?: string; url?: string };

  function parseJSON(text: string): RawRow[] {
    try {
      const val = JSON.parse(text);
      if (Array.isArray(val)) return val as RawRow[];
      // object with property 'rows'?
      if (val && Array.isArray((val as any).rows)) return (val as any).rows as RawRow[];
      return [];
    } catch {
      return [];
    }
  }

  function parseDelimited(text: string, delim: "," | "\t"): RawRow[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (!lines.length) return [];
    const head = splitLine(lines[0], delim);
    const hasHeader =
      head.some((h) => /^name$/i.test(h)) &&
      head.some((h) => /^language$/i.test(h)) &&
      head.some((h) => /^url$/i.test(h));

    if (hasHeader) {
      const idxName = head.findIndex((h) => /^name$/i.test(h));
      const idxLang = head.findIndex((h) => /^language$/i.test(h));
      const idxUrl = head.findIndex((h) => /^url$/i.test(h));
      return lines.slice(1).map((line) => {
        const cells = splitLine(line, delim);
        return {
          name: cells[idxName] ?? "",
          language: cells[idxLang] ?? "",
          url: cells[idxUrl] ?? "",
        };
      });
    } else {
      // assume columns: name, language, url
      return lines.map((line) => {
        const [name = "", language = "", url = ""] = splitLine(line, delim);
        return { name, language, url };
      });
    }
  }

  function splitLine(line: string, delim: "," | "\t") {
    // simple split (no quoted field support). If you need quotes, say the word.
    return line.split(delim).map((s) => s.trim());
  }

  function toPreview(rows: RawRow[]): PreviewItem[] {
    return rows.map((r) => {
      const raw = (r.url || "").trim();
      const urlHttps = forceHttps(raw);
      const valid = !!urlHttps;
      return {
        name: (r.name || "").trim(),
        language: (r.language || "").trim(),
        urlRaw: raw,
        urlHttps,
        valid,
        reason: valid ? undefined : "Invalid URL (not fixable to https)",
      };
    });
  }

  const counts = useMemo(() => {
    const total = preview.length;
    const ok = preview.filter((p) => p.valid).length;
    const bad = total - ok;
    return { total, ok, bad };
  }, [preview]);

  // --- UI ---
  return (
    <div className="max-w-3xl mx-auto">
      {/* Top row: Choose + kind badge + Add button */}
      <div className="flex flex-wrap items-center gap-12 mb-4">
        <div className="flex items-center gap-10">
          {/* Choose file (button only) */}
          <label className="linklike" style={{ cursor: "pointer" }}>
            {labelChoose}
            <input
              type="file"
              accept=".csv,.tsv,.json,text/csv,text/tab-separated-values,application/json"
              onChange={onFileChange}
              style={{ display: "none" }}
            />
          </label>

          {/* kind badge (Thai flag red) */}
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 6,
              background: "#a51931", // Thai red
              color: "#fff",
              fontSize: 12,
            }}
          >
            {kindLabel || "CSV / TSV / JSON"}
          </span>
        </div>

        {/* Add button (Thai flag blue) */}
        <button
          className="btn-blue"
          disabled={!preview.some((p) => p.valid) || importing}
          onClick={doImport}
          style={{
            background: "#2d2a4b", // your dark/navy or use Thai blue #2d2a4b you used
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            cursor: preview.some((p) => p.valid) && !importing ? "pointer" : "not-allowed",
          }}
        >
          {labelAdd}
        </button>
      </div>

      {/* Counts + tip */}
      <div className="text-sm mb-2">
        {counts.total} rows — {counts.ok} valid, {counts.bad} invalid
      </div>
      <div className="text-xs" style={{ color: "#6b7280" }}>
        {tipCoerce}
      </div>

      {/* Import message */}
      {importMsg && (
        <div className="mt-3 text-sm" style={{ whiteSpace: "pre-wrap" }}>
          {importMsg}
        </div>
      )}

      {/* Preview table */}
      {!!preview.length && (
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="px-2 py-1 border">Name</th>
                <th className="px-2 py-1 border">Language</th>
                <th className="px-2 py-1 border">URL (raw)</th>
                <th className="px-2 py-1 border">URL (https)</th>
                <th className="px-2 py-1 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-1 border">{r.name}</td>
                  <td className="px-2 py-1 border">{r.language}</td>
                  <td className="px-2 py-1 border">{r.urlRaw}</td>
                  <td className="px-2 py-1 border">{r.urlHttps ?? ""}</td>
                  <td className="px-2 py-1 border" style={{ color: r.valid ? "#059669" : "#b91c1c" }}>
                    {r.valid ? "OK" : r.reason || "Invalid"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
