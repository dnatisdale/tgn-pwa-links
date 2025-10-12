// src/ImportExport.tsx
import React, { useMemo, useState } from "react";
import { auth, db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { t, Lang } from "./i18n";
import { toHttpsOrNull as toHttps } from "./url";

type PreviewItem = { name?: string; language?: string; url?: string; reason?: string };

export default function ImportExport({ lang }: { lang: Lang }) {
  const i = t(lang);

  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const exts = useMemo(() => {
    const n = file?.name?.toLowerCase() || "";
    return {
      isJSON: n.endsWith(".json"),
      isTSV: n.endsWith(".tsv"),
      isCSV: n.endsWith(".csv"),
    };
  }, [file]);

  function parsePlain(text: string, sep: "," | "\t"): PreviewItem[] {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const head = lines[0].split(sep).map((s) => s.trim().toLowerCase());
    const hasHeader = head.includes("name") || head.includes("language") || head.includes("url");

    const rows = hasHeader ? lines.slice(1) : lines;
    const items: PreviewItem[] = rows.map((ln) => {
      const cols = ln.split(sep).map((s) => s.trim());
      let name = "", language = "", urlRaw = "";

      if (hasHeader) {
        const get = (key: string) => {
          const idx = head.indexOf(key);
          return idx >= 0 ? (cols[idx] || "") : "";
        };
        name = get("name");
        language = get("language");
        urlRaw = get("url");
      } else {
        [name, language, urlRaw] = [cols[0] || "", cols[1] || "", cols[2] || ""];
      }

      const urlHttps = toHttps(urlRaw);
      return urlHttps
        ? { name, language, url: urlHttps }
        : { name, language, reason: "URL must be https", url: "" };
    });

    return items;
  }

  async function onPickFile(f: File) {
    setFile(f);
    setMsg("");
    const txt = await f.text();
    setText(txt);

    try {
      if (f.name.toLowerCase().endsWith(".json")) {
        const data = JSON.parse(txt);
        const arr = Array.isArray(data) ? data : [];
        const items: PreviewItem[] = arr.map((r: any) => {
          const urlHttps = toHttps(r?.url ?? "");
          return urlHttps
            ? { name: r?.name ?? "", language: r?.language ?? "", url: urlHttps }
            : { name: r?.name ?? "", language: r?.language ?? "", url: "", reason: "URL must be https" };
        });
        setPreview(items);
      } else if (f.name.toLowerCase().endsWith(".tsv")) {
        setPreview(parsePlain(txt, "\t"));
      } else {
        // default CSV
        setPreview(parsePlain(txt, ","));
      }
    } catch (e: any) {
      setPreview([]);
      setMsg(e?.message || "Could not parse file");
    }
  }

  async function doImport() {
    setMsg("");
    if (!auth.currentUser) {
      setMsg("Not signed in.");
      return;
    }
    const valid = preview.filter((p) => p.url);
    if (valid.length === 0) {
      setMsg("Nothing to import (no valid https URLs).");
      return;
    }
    setImporting(true);
    try {
      const col = collection(db, "users", auth.currentUser.uid, "links");
      for (const it of valid) {
        await addDoc(col, {
          name: it.name || "",
          language: it.language || "",
          url: it.url,
          createdAt: serverTimestamp(),
        });
      }
      setMsg(`Imported ${valid.length} item(s).`);
      setPreview([]);
      setFile(null);
      setText("");
    } catch (e: any) {
      setMsg(e?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const validCount = preview.filter((p) => p.url).length;
  const invalidCount = preview.length - validCount;

  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-semibold mb-3">{i.importExport}</h2>

      {/* Top row: Choose file + format chip + Add button */}
      <div className="flex items-center gap-10 mb-4">
        <label className="btn-red">
          Choose a file
          <input
            type="file"
            accept=".csv,.tsv,.json,text/csv,text/tab-separated-values,application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPickFile(f);
            }}
          />
        </label>

        <span className="chip gray70">(CSV / TSV / JSON)</span>

        <button
          className="btn-blue"
          disabled={!file || preview.length === 0 || importing}
          onClick={doImport}
          title="Add parsed items to your list"
        >
          Add
        </button>
      </div>

      {/* Status */}
      {msg && <div className="mt-2 text-sm">{msg}</div>}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="mt-4">
          <div className="text-sm mb-2">
            Preview: {validCount} valid, {invalidCount} invalid
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="border px-2 py-1 text-left">Name</th>
                <th className="border px-2 py-1 text-left">Language</th>
                <th className="border px-2 py-1 text-left">URL (https)</th>
                <th className="border px-2 py-1 text-left">Note</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 200).map((r, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{r.name}</td>
                  <td className="border px-2 py-1">{r.language}</td>
                  <td className="border px-2 py-1" style={{ color: r.url ? "inherit" : "#b91c1c" }}>
                    {r.url || ""}
                  </td>
                  <td className="border px-2 py-1" style={{ color: "#b91c1c" }}>
                    {r.reason || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {preview.length > 200 && (
            <div className="text-xs mt-2" style={{ color: "#6b7280" }}>
              Showing first 200 rows…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
