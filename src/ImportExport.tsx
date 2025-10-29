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
  if (/^http:\/\//i.test(raw)) return null;
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
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
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

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(null);
    setMsg('');
    if (!f) return;

    setParsing(true);
    try {
      const text = await f.text();
      const lower = f.name.toLowerCase();
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
            reason: urlHttps ? undefined : t('mustBeHttps'),
          };
        });
      } else {
        const grid = splitCSVorTSV(text);
        if (!grid.length) {
          setMsg(t('noRows'));
          setParsing(false);
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
            reason: urlHttps ? undefined : t('mustBeHttps'),
          };
        });
      }

      setPreview(rows);
      setMsg('');
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setParsing(false);
    }
  }

  async function doImport() {
    const user = auth.currentUser;
    if (!user) {
      alert(t('pleaseSignIn'));
      return;
    }
    if (!preview || !preview.length) {
      alert(t('nothingToImport'));
      return;
    }
    const valid = preview.filter((p) => p.urlHttps);
    if (!valid.length) {
      alert(t('invalidUrl'));
      return;
    }

    try {
      setMsg(t('saving'));
      const col = collection(db, 'users', user.uid, 'links');
      for (const v of valid) {
        await addDoc(col, {
          name: (v.name || v.urlRaw || '').trim(),
          language: (v.language || '').trim(),
          url: v.urlHttps,
          createdAt: serverTimestamp(),
        });
      }
      setMsg(t('importComplete'));
      setFile(null);
      setPreview(null);
    } catch (e: any) {
      setMsg(e?.message || String(e));
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{t('import')}</h2>

      <div className="file-row" style={{ marginBottom: 12 }}>
        <label htmlFor="tgn-import-file" className="btn btn-red" style={{ cursor: 'pointer' }}>
          {t('chooseFile')}
        </label>
        <input
          id="tgn-import-file"
          type="file"
          accept=".csv,.tsv,.json,text/csv,text/tab-separated-values,application/json"
          onChange={onPickFile}
          style={{ display: 'none' }}
        />
        <span className="pill-red">(CSV / TSV / JSON)</span>
        {preview && (
          <button className="btn btn-blue" onClick={doImport} disabled={!stats.valid || parsing}>
            {t('add')}
          </button>
        )}
      </div>

      {file && (
        <div className="hint-under" style={{ marginBottom: 8 }}>
          {t('file') || 'File:'} {file.name}
        </div>
      )}
      {msg && <div style={{ marginBottom: 12, color: '#a51931' }}>{msg}</div>}

      {preview && (
        <div className="card" style={{ padding: 12 }}>
          <div style={{ marginBottom: 8, fontSize: 14 }}>
            {t('preview')}: {stats.valid} {t('valid') || 'valid'} · {stats.invalid}{' '}
            {t('invalid') || 'invalid'}
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
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>{t('ok') || 'OK'}</span>
                      ) : (
                        <span style={{ color: '#a51931' }}>{p.reason || t('invalid')}</span>
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
