import React, { useMemo, useState } from 'react';
import { auth, db } from './firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useI18n } from './i18n-provider';

type PreviewItem = {
  name: string;
  language: string;
  urlRaw: string;
  urlHttps: string | null;
  reason?: string;
};

function toHttpsOrNull(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;
  if (/^http:\/\//i.test(raw)) return null; // disallow plain http
  const withScheme = /^(https?:)?\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'https:') return null;
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
  const sep = looksTSV ? '\t' : ',';
  return lines.map((l) => l.split(sep).map((x) => x.trim()));
}

function asArray(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (x && typeof x === 'object') return [x];
  return [];
}

export default function ImportExport() {
  // --- safe i18n so the UI never shows "undefined" ---
  let t = (k: string) => k;
  try {
    const i = useI18n();
    if (i && typeof i.t === 'function') t = i.t;
  } catch {}
  const tOr = (k: string, fb: string) => {
    try {
      const v = t?.(k);
      return (v ?? '').toString().trim() || fb;
    } catch {
      return fb;
    }
  };

  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState<string>(''); // new: paste area
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [msg, setMsg] = useState<string>('');

  const stats = useMemo(() => {
    if (!preview) return { valid: 0, invalid: 0 };
    let valid = 0,
      invalid = 0;
    for (const p of preview) p.urlHttps ? valid++ : invalid++;
    return { valid, invalid };
  }, [preview]);

  async function parseFromText(text: string, filenameHint = '') {
    setParsing(true);
    try {
      const lower = filenameHint.toLowerCase();
      let rows: PreviewItem[] = [];

      if (lower.endsWith('.json')) {
        const json = JSON.parse(text);
        const arr = asArray(json);
        rows = arr.map((o: any) => {
          const name = String(o.name ?? '').trim();
          const language = String(o.language ?? '').trim();
          const urlRaw = String(o.url ?? '').trim();
          const urlHttps = toHttpsOrNull(urlRaw);
          return {
            name,
            language,
            urlRaw,
            urlHttps,
            reason: urlHttps ? undefined : tOr('mustBeHttps', 'Must be an HTTPS link'),
          };
        });
      } else {
        const grid = splitCSVorTSV(text);
        if (!grid.length) {
          setMsg(tOr('noRows', 'No rows found.'));
          setPreview(null);
          return;
        }
        const header = grid[0].map((h) => h.toLowerCase());
        const hasHeader = ['name', 'language', 'url'].some((h) => header.includes(h));
        const body = hasHeader ? grid.slice(1) : grid;

        let nameIdx = 0,
          langIdx = 1,
          urlIdx = 2;
        if (hasHeader) {
          nameIdx = header.indexOf('name');
          langIdx = header.indexOf('language');
          urlIdx = header.indexOf('url');
        }

        rows = body.map((cols) => {
          const name = (cols[nameIdx] ?? '').trim();
          const language = (cols[langIdx] ?? '').trim();
          const urlRaw = (cols[urlIdx] ?? '').trim();
          const urlHttps = toHttpsOrNull(urlRaw);
          return {
            name,
            language,
            urlRaw,
            urlHttps,
            reason: urlHttps ? undefined : tOr('mustBeHttps', 'Must be an HTTPS link'),
          };
        });
      }

      setPreview(rows);
      setMsg('');
    } catch (e: any) {
      setMsg(e?.message || String(e));
      setPreview(null);
    } finally {
      setParsing(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(null);
    setMsg('');
    if (!f) return;
    const text = await f.text();
    await parseFromText(text, f.name);
  }

  async function parseFromPaste() {
    setFile(null); // clear file if using paste
    setPreview(null);
    setMsg('');
    const text = pasteText.trim();
    if (!text) {
      setMsg(tOr('noRows', 'No rows found.'));
      return;
    }
    // Heuristic: if starts with '{' or '[' treat as JSON
    const hint =
      text.trim().startsWith('{') || text.trim().startsWith('[') ? 'data.json' : 'data.csv';
    await parseFromText(text, hint);
  }

  async function doImport() {
    const user = auth.currentUser;
    if (!user) {
      alert(tOr('pleaseSignIn', 'Please sign in first.'));
      return;
    }
    if (!preview || !preview.length) {
      alert(tOr('nothingToImport', 'Nothing to import.'));
      return;
    }
    const valid = preview.filter((p) => p.urlHttps);
    if (!valid.length) {
      alert(tOr('invalidUrl', 'Please enter a valid HTTPS URL (https://...)'));
      return;
    }

    try {
      setMsg(tOr('saving', 'Saving…'));
      const col = collection(db, 'users', user.uid, 'links');
      for (const v of valid) {
        await addDoc(col, {
          name: (v.name || v.urlRaw || '').trim(),
          language: (v.language || '').trim(),
          url: v.urlHttps,
          createdAt: serverTimestamp(),
        });
      }
      setMsg(tOr('importComplete', 'Import complete.'));
      setFile(null);
      setPasteText('');
      setPreview(null);
    } catch (e: any) {
      setMsg(e?.message || String(e));
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 not-italic">{tOr('import', 'Import')}</h2>

      {/* File picker row */}
      <div className="file-row flex items-center gap-3 mb-3">
        {/* Accessible label tied to the hidden input */}
        <label
          htmlFor="tgn-import-file"
          className="btn btn-red not-italic"
          style={{ cursor: 'pointer' }}
        >
          {tOr('chooseFile', 'Choose file')}
        </label>

        <input
          id="tgn-import-file"
          name="tgn-import-file"
          type="file"
          accept=".csv,.tsv,.json,text/csv,text/tab-separated-values,application/json"
          className="w-full border rounded px-3 py-2 not-italic"
          onChange={onPickFile}
          style={{ display: 'none' }} // label acts as the visible trigger
        />

        <span className="pill-red not-italic">(CSV / TSV / JSON)</span>

        {preview && (
          <button
            className="btn btn-blue not-italic"
            onClick={doImport}
            disabled={!stats.valid || parsing}
          >
            {tOr('add', 'Add')}
          </button>
        )}
      </div>

      {/* Show selected file name, if any */}
      {file && (
        <div className="hint-under not-italic mb-2">
          {tOr('file', 'File')}: {file.name}
        </div>
      )}

      {/* Paste-in option */}
      <div className="mb-3">
        <label htmlFor="tgn-import-text" className="block text-sm font-semibold mb-1 not-italic">
          {tOr('importText', 'Or paste data')}
        </label>
        <textarea
          id="tgn-import-text"
          name="tgn-import-text"
          className="w-full border rounded px-3 py-2 not-italic"
          rows={6}
          placeholder={tOr(
            'pasteHint',
            'CSV/TSV: name,language,url\nJSON: [{"name":"...","language":"...","url":"https://..."}]'
          )}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <div className="mt-2 flex gap-8">
          <button className="btn btn-blue not-italic" onClick={parseFromPaste} disabled={parsing}>
            {tOr('preview', 'Preview')}
          </button>
          {preview && (
            <button
              className="btn btn-red not-italic"
              onClick={doImport}
              disabled={!stats.valid || parsing}
            >
              {tOr('add', 'Add')}
            </button>
          )}
        </div>
      </div>

      {/* Status / errors */}
      {msg && (
        <div className="mb-3 not-italic" style={{ color: '#a51931' }}>
          {msg}
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div className="card" style={{ padding: 12 }}>
          <div className="mb-2 not-italic" style={{ fontSize: 14 }}>
            {tOr('preview', 'Preview')}: {stats.valid} {tOr('valid', 'valid')} · {stats.invalid}{' '}
            {tOr('invalid', 'invalid')}
          </div>

          <div
            style={{
              maxHeight: 320,
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f9fafb' }}>
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
                    <td style={td}>{p.name || <em style={{ color: '#6b7280' }}>—</em>}</td>
                    <td style={td}>{p.language || <em style={{ color: '#6b7280' }}>—</em>}</td>
                    <td style={td} title={p.urlRaw}>
                      {p.urlRaw}
                    </td>
                    <td style={td}>
                      {p.urlHttps ? (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>{tOr('ok', 'OK')}</span>
                      ) : (
                        <span style={{ color: '#a51931' }}>
                          {p.reason || tOr('invalid', 'invalid')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '1px solid #e5e7eb',
  fontWeight: 600,
};

const td: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '1px solid #f3f4f6',
};
