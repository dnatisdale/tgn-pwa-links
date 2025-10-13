// src/ImportExport.tsx
import React, { useMemo, useState } from "react";
import { t, Lang } from "./i18n";
import { auth, db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

type Props = { lang: Lang };
type PreviewItem = {
  name: string;
  language: string;
  urlRaw: string;
  urlHttps: string | null; // null if invalid/non-https
  reason?: string;         // why skipped
};

// ---------------- helpers ----------------
function toHttpsOrNull(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  if (/^http:\/\//i.test(raw)) return null; // reject non-secure
  const withScheme = /^(https?:)?\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function splitCSVorTSV(text: string): string[][] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (!lines.length) return [];
  const looksTSV = (lines[0].match(/\t/g) || []).length >= (lines[0].match(/,/g) || []).length;
  const sep = looksTSV ? "\t" : ",";
  return lines.map((l) => l.split(sep).map((x) => x.trim()));
}

function asArray(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") return [x];
  return [];
}

// --------------- component ----------------
export default function ImportExport({ lang }: Props) {
  const i = t(lang);

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [msg, setMsg] = useState<string>("");

  const stats = useMemo(() => {
    if (!preview) return { valid: 0, invalid: 0 };
    let valid = 0;
    let invalid = 0;
    for (const p of preview) (p.urlHttps ? valid++ : invalid++);
    return { valid, invalid };
  }, [preview]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(null);
    setMsg("");
    if (!f) return;

    setParsing(true);
    try {
      const text = await f.text();
      const lower = f.name.toLowerCase();
      let rows: PreviewItem[] = [];

      if (lower.endsWith(".json")) {
        const json = JSON.parse(text);
        const arr = asArray(json);
        rows = arr.map((o: any) => {
          const name = String(o.name ?? "").trim();
          const language = String(o.language ?? "").trim();
          const urlRaw = String(o.url ?? "").trim();
          const urlHttps = toHttpsOrNull(urlRaw);
          return {
            name,
            language,
            urlRaw,
            urlHttps,
            reason: urlHttps ? undefined : "URL must be https (or leave off scheme to auto-https)",
          };
        });
      } else {
        const grid = splitCSVorTSV(text);
        if (!grid.length) {
          setMsg("No rows found.");
          setParsing(false);
          return;
        }
        const header = grid[0].map((h) => h.toLowerCase());
        const hasHeader = ["name", "language", "url"].some((h) => header.includes(h));
        const body = hasHeader ? grid.slice(1) : grid;

        let nameIdx = -1, langIdx = -1, urlIdx = -1;
        if (hasHeader) {
          nameIdx = header.indexOf("name");
          langIdx = header.indexOf("language");
          urlIdx = header.indexOf("url");
        } else {
          nameIdx = 0; langIdx = 1; urlIdx = 2;
        }

        rows = body.map((cols) => {
          const name = (cols[nameIdx] ?? "").trim();
          const language = (cols[langIdx] ?? "").trim();
          const urlRaw = (cols[urlIdx] ?? "").trim();
          const urlHttps = toHttpsOrNull(urlRaw);
          return {
            name,
            language,
            urlRaw,
            urlHttps,
            reason: urlHttps ? undefined : "URL must be https (or leave off scheme to auto-https)",
          };
        });
      }

      setPreview(rows);
      setMsg("");
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setParsing(false);
    }
  }

  async function doImport() {
    const user = auth.currentUser;
    if (!user) {
      alert(lang === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "Please sign in first.");
      return;
    }
    if (!preview || !preview.length) {
      alert(lang === "th" ? "ไม่มีข้อมูลสำหรับนำเข้า" : "Nothing to import.");
      return;
    }
    const valid = preview.filter((p) => p.urlHttps);
    if (!valid.length) {
      alert(lang === "th" ? "ไม่มี URL ที่ถูกต้อง (https)" : "No valid https URLs.");
      return;
    }

    try {
      setMsg(lang === "th" ? "กำลังนำเข้า…" : "Importing…");
      const col = collection(db, "users", user.uid, "links");
      for (const v of valid) {
        await addDoc(col, {
          name: (v.name || v.urlRaw || "").trim(),
          language: (v.language || "").trim(),
          url: v.urlHttps,
          createdAt: serverTimestamp(),
        });
      }
      setMsg(lang === "th" ? "นำเข้าสำเร็จ" : "Import complete");
      setFile(null);
      setPreview(null);
    } catch (e: any) {
      setMsg(e?.message || String(e));
    }
  }

  return (
    <section>
      {/* ✅ Title = Import (no duplicate “Import / Export”) */}
      <h2 className="text-lg font-semibold mb-3">
        {lang === "th" ? "นำเข้า" : "Import"}
      </h2>

      {/* Top row */}
      <div className="file-row" style={{ marginBottom: 12 }}>
        {/* Choose file (Thai red) */}
        <label htmlFor="tgn-import-file" className="btn btn-red" style={{ cursor: "pointer" }}>
          {lang === "th" ? "เลือกไฟล์" : "Choose file"}
        </label>
        <input
          id="tgn-import-file"
          type="file"
          accept=".csv,.tsv,.json,text/csv,text/tab-separated-values,application/json"
          onChange={onPickFile}
          style={{ display: "none" }}
        />

        {/* Formats pill */}
        <span className="pill-red">(CSV / TSV / JSON)</span>

        {/* Add (only after preview) */}
        {preview && (
          <button className="btn btn-blue" onClick={doImport} disabled={!stats.valid || parsing}>
            {lang === "th" ? "เพิ่ม" : "Add"}
          </button>
        )}
      </div>

      {/* File name + status */}
      {file && (
        <div className="hint-under" style={{ marginBottom: 8 }}>
          {lang === "th" ? "ไฟล์:" : "File:"} {file.name}
        </div>
      )}
      {msg && <div style={{ marginBottom: 12, color: "#a51931" }}>{msg}</div>}

      {/* Preview table */}
      {preview && (
        <div className="card" style={{ padding: 12 }}>
          <div style={{ marginBottom: 8, fontSize: 14 }}>
            {lang === "th"
              ? `ตรวจสอบตัวอย่าง: ถูกต้อง ${stats.valid} แถว · ข้าม ${stats.invalid} แถว`
              : `Preview: ${stats.valid} valid · ${stats.invalid} skipped`}
          </div>

          <div style={{ maxHeight: 320, overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ position: "sticky", top: 0, background: "#f9fafb" }}>
                <tr>
                  <th style={th}>Name</th>
                  <th style={th}>Language</th>
                  <th style={th}>URL</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((p, idx) => (
                  <tr key={idx}>
                    <td style={td}>{p.name || <em style={{ color: "#6b7280" }}>—</em>}</td>
                    <td style={td}>{p.language || <em style={{ color: "#6b7280" }}>—</em>}</td>
                    <td style={td} title={p.urlRaw}>{p.urlRaw}</td>
                    <td style={td}>
                      {p.urlHttps ? (
                        <span style={{ color: "#16a34a", fontWeight: 600 }}>
                          {lang === "th" ? "จะนำเข้า" : "OK"}
                        </span>
                      ) : (
                        <span style={{ color: "#a51931" }}>
                          {p.reason || (lang === "th" ? "ไม่ถูกต้อง" : "Invalid")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="hint-under" style={{ marginTop: 8 }}>
            {lang === "th"
              ? "เคล็ดลับ: ถ้าเว้นว่างหรือเป็น http:// จะถูกข้าม ให้แก้ไขไฟล์แล้วนำเข้าใหม่"
              : "Tip: if URL is empty or http:// it’s skipped. Fix your file and re-import."}
          </div>
        </div>
      )}
    </section>
  );
}

// table cell styles
const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
};
const td: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #f3f4f6",
};
