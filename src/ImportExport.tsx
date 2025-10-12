// src/ImportExport.tsx
import React from "react";
import { strings, type Lang } from "./i18n";

export type Row = { name: string; language: string; url: string };

type Props = {
  lang: Lang;
  // Optional callback. App.tsx currently doesn’t pass it, which is fine.
  onBatchAdd?: (rows: Row[]) => void;
};

type ParsedRow = Row & { _valid: boolean; _reason?: string };

function toHttps(raw: string): string {
  if (!raw) return "";
  let s = raw.trim();

  // Auto-fix common cases
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("http://")) s = "https://" + s.slice("http://".length);
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;

  return s;
}

function isValidHttpsUrl(u: string): boolean {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && !!x.host;
  } catch {
    return false;
  }
}

function parseCSVorTSV(text: string): Row[] {
  // Simple parser: split lines; if any tab found, use TSV, else CSV.
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const delim = lines.some((l) => l.includes("\t")) ? "\t" : ",";

  // detect header
  const header = lines[0].toLowerCase();
  const hasHeader =
    header.includes("name") && (header.includes("language") || header.includes("lang")) && header.includes("url");

  const start = hasHeader ? 1 : 0;
  const rows: Row[] = [];
  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(delim).map((p) => p.trim());
    if (parts.length < 3) continue;
    const [name, language, url] = parts;
    rows.push({ name, language, url });
  }
  return rows;
}

function parseJSON(text: string): Row[] {
  try {
    const v = JSON.parse(text);
    if (Array.isArray(v)) {
      return v
        .map((x) => ({
          name: String(x.name ?? "").trim(),
          language: String(x.language ?? "").trim(),
          url: String(x.url ?? "").trim(),
        }))
        .filter((r) => r.name || r.language || r.url);
    }
    return [];
  } catch {
    return [];
  }
}

function parseByFilename(name: string, text: string): Row[] {
  const lower = name.toLowerCase();
  if (lower.endsWith(".json")) return parseJSON(text);
  if (lower.endsWith(".tsv")) return parseCSVorTSV(text);
  // default to CSV/TSV parser
  return parseCSVorTSV(text);
}

export default function ImportOnly({ lang, onBatchAdd }: Props) {
  const t = strings[lang];
  const [fileName, setFileName] = React.useState<string>("");
  const [rawText, setRawText] = React.useState<string>("");
  const [parsed, setParsed] = React.useState<ParsedRow[]>([]);
  const [msg, setMsg] = React.useState<string>("");

  function validateRows(rows: Row[]): ParsedRow[] {
    const out: ParsedRow[] = [];
    for (const r of rows) {
      const fixedUrl = toHttps(r.url);
      if (!fixedUrl || !isValidHttpsUrl(fixedUrl)) {
        out.push({
          name: (r.name || "").trim(),
          language: (r.language || "").trim(),
          url: fixedUrl || r.url,
          _valid: false,
          _reason: t.tipInvalid,
        });
      } else {
        out.push({
          name: (r.name || "").trim(),
          language: (r.language || "").trim(),
          url: fixedUrl,
          _valid: true,
        });
      }
    }
    return out;
  }

  function handleTextChange(text: string, nameHint = "data.csv") {
    setRawText(text);
    const baseRows = parseByFilename(nameHint, text);
    const validated = validateRows(baseRows);
    setParsed(validated);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      handleTextChange(text, f.name);
    };
    reader.readAsText(f);
  }

  function doImport() {
    const good = parsed.filter((r) => r._valid).map(({ name, language, url }) => ({ name, language, url }));
    if (good.length === 0) {
      setMsg(t.tipInvalid);
      return;
    }
    if (onBatchAdd) {
      onBatchAdd(good);
    } else {
      setMsg(`Imported ${good.length} row(s). (Wire Firestore later.)`);
    }
  }

  const goodCount = parsed.filter((r) => r._valid).length;
  const badCount = parsed.length - goodCount;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t.import}</h1>

      {/* File chooser */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".csv,.tsv,.json,text/csv,text/tab-separated-values,application/json"
          onChange={handleFile}
        />
        <span className="text-sm opacity-70">{fileName || ""}</span>
      </div>

      {/* OR paste area */}
      <div className="space-y-2">
        <div className="text-sm opacity-80">Paste CSV / TSV / JSON:</div>
        <textarea
          className="w-full min-h-[160px] p-2 border rounded"
          placeholder={`name,language,url
John,en,https://example.com`}
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
        />
      </div>

      {/* Summary */}
      {parsed.length > 0 && (
        <div className="text-sm">
          <span className="font-semibold">{parsed.length}</span> rows •{" "}
          <span className="text-green-700 font-semibold">{goodCount}</span> valid •{" "}
          <span className="text-red-700 font-semibold">{badCount}</span> invalid
        </div>
      )}

      {/* Preview table (compact) */}
      {parsed.length > 0 && (
        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">{strings.en.name}</th>
                <th className="text-left p-2">{strings.en.language}</th>
                <th className="text-left p-2">{strings.en.url}</th>
                <th className="text-left p-2">OK?</th>
              </tr>
            </thead>
            <tbody>
              {parsed.slice(0, 200).map((r, i) => (
                <tr key={i} className={r._valid ? "" : "bg-red-50"}>
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2 break-words">{r.name}</td>
                  <td className="p-2 break-words">{r.language}</td>
                  <td className="p-2 break-words">
                    <a className="underline" href={r.url} target="_blank" rel="noreferrer">
                      {r.url}
                    </a>
                    {!r._valid && <div className="text-red-700 text-xs mt-1">{t.tipInvalid}</div>}
                  </td>
                  <td className="p-2">{r._valid ? "✓" : "✗"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import button + message */}
      <div className="flex items-center gap-3">
        <button className="btn btn-blue" disabled={parsed.length === 0} onClick={doImport}>
          {t.import}
        </button>
        {msg && <div className="text-sm">{msg}</div>}
      </div>

      {/* Required tip text on failure scenarios */}
      <div className="text-xs opacity-80">{t.tipInvalid}</div>
    </div>
  );
}
