// src/ImportExport.tsx (Import-only page)
import React, { useState } from "react";
import { strings, type Lang } from "./i18n";

type Props = { lang: Lang };

type Row = { name: string; language: string; url: string };

function toHttps(u: string): string {
  let x = (u || "").trim();
  if (!x) return "";
  if (x.startsWith("//")) x = "https:" + x;
  if (x.startsWith("http://")) x = "https://" + x.slice(7);
  if (!/^https?:\/\//i.test(x)) x = "https://" + x;
  return x.replace(/^http:\/\//i, "https://");
}

function parseCSVorTSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const rows: Row[] = [];
  for (const line of lines) {
    const parts = line.split(/[\t,]/); // simple: split by tab or comma
    const [name = "", language = "", url = ""] = parts.map(s => s.trim());
    rows.push({ name, language, url });
  }
  return rows;
}

async function parseFile(file: File): Promise<Row[]> {
  const text = await file.text();
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".json")) {
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? (arr as Row[]) : [];
  }
  if (lower.endsWith(".csv")) return parseCSVorTSV(text);
  if (lower.endsWith(".tsv")) return parseCSVorTSV(text);
  // default: try CSV/TSV anyway
  return parseCSVorTSV(text);
}

export default function ImportOnly({ lang }: Props) {
  const t = strings[lang];
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    try {
      const parsed = await parseFile(f);
      // validate + autofix https
      const cleaned: Row[] = parsed.map(r => ({
        name: r.name?.trim() || "",
        language: r.language?.trim() || "",
        url: toHttps(r.url || "")
      })).filter(r => r.name && r.url && r.url.startsWith("https://"));

      // if any rejected, show the tip
      if (cleaned.length === 0) {
        setError(t.tipInvalid);
      }
      setRows(cleaned);
    } catch {
      setError(t.tipInvalid);
    }
  }

  function doImport() {
    // TODO: batch add to Firestore; for now just log
    console.log("IMPORT", rows);
    alert(`Imported ${rows.length} rows`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">{t.import}</h1>

      <input type="file" accept=".csv,.tsv,.json,text/csv,text/tab-separated-values,application/json" onChange={onPick} />

      {error && <div className="mt-3 text-sm text-red-700">{error}</div>}

      {rows.length > 0 && (
        <div className="mt-4">
          <div className="text-sm opacity-70 mb-2">Preview ({rows.length})</div>
          <div className="border rounded-lg overflow-auto" style={{maxHeight: 300}}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Language</th>
                  <th className="text-left p-2">URL</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">{r.language}</td>
                    <td className="p-2 break-all">{r.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <button className="btn btn-blue" onClick={doImport}>Add {rows.length}</button>
          </div>
        </div>
      )}
    </div>
  );
}
