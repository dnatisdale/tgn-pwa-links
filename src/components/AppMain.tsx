// src/components/AppMain.tsx — main body (if you keep this component)
import AddLink from '../AddLink';
import ImportExport from '../ImportExport';
import ExportPage from '../Export';
import UpdateToast from '../UpdateToast';
import Share from '../Share';
import QR from '../QR';
import { useAppLogic } from '../hooks/useAppLogic';
import { Row } from '../hooks/useAppLogic';
import { toHttpsOrNull as toHttps } from '../url';
import { auth, db } from '../firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

// tell TypeScript that we may set this on window in main.tsx
declare global {
  interface Window {
    __REFRESH_SW__?: (reload?: boolean) => void;
  }
}

// Build constants
declare const __APP_VERSION__: string | undefined;
declare const __BUILD_PRETTY__: string | undefined;

function AppMain() {
  const {
    lang,
    setLang,
    user,
    rows,
    q,
    setQ,
    filterThai,
    setFilterThai,
    textPx,
    setTextPx,
    qrEnlargedId,
    setQrEnlargedId,
    selectedIds,
    setSelectedIds,
    lastLogin,
    route,
    setRoute,
    showUpdate,
    setShowUpdate,
    isBrowse,
    isAdd,
    isImport,
    isExport,
    isAbout,
    filtered,
    selectedRows,
    firstSelected,
    allSelected,
    toggleSelect,
    toggleSelectAll,
    copySelectedLinks,
    batchDownload,
  } = useAppLogic();

  const i =
    lang === 'th'
      ? { add: 'เพิ่ม', empty: 'ไม่มีรายการ', logout: 'ออกจากระบบ' }
      : { add: 'Add', empty: 'No items', logout: 'Logout' };

  const editRow = async (r: Row) => {
    const name = prompt('Name', r.name ?? '');
    if (name === null) return;
    const language = prompt('Language', r.language ?? '') ?? '';
    const url = prompt('URL (https only)', r.url ?? '');
    if (url === null) return;
    const https = toHttps(url);
    if (!https) {
      alert('Please enter a valid https:// URL');
      return;
    }
    await updateDoc(doc(db, 'users', user.uid, 'links', r.id), {
      name: name.trim(),
      language: language.trim(),
      url: https,
    });
  };

  const deleteRow = async (r: Row) => {
    if (!confirm(`Delete "${r.name || r.url}"?`)) return;
    await deleteDoc(doc(db, 'users', user.uid, 'links', r.id));
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(r.id);
      return n;
    });
  };

  // SAFE build text for footer
  const buildText =
    (__APP_VERSION__ ? `v${__APP_VERSION__}` : 'dev') +
    (__BUILD_PRETTY__ ? ` • ${__BUILD_PRETTY__}` : '');

  return (
    <main className="p-3 max-w-5xl mx-auto app-main">
      {isAdd ? (
        <section>
          <h2 className="text-lg font-semibold mb-2">{i.add}</h2>
          <AddLink lang={lang} />
        </section>
      ) : isImport ? (
        <section>
          <h2 className="text-lg font-semibold mb-2">Import</h2>
          <ImportExport lang={lang} />
        </section>
      ) : isExport ? (
        <section>
          <h2 className="text-lg font-semibold mb-2">Export</h2>
          <ExportPage lang={lang} rows={rows} />
        </section>
      ) : isAbout ? (
        <section>
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p className="text-sm text-gray-700">
            Thai Good News — a simple PWA for saving, sharing, and printing QR link cards.
          </p>
        </section>
      ) : (
        <section>
          {/* Search + filter */}
          <div className="flex flex-wrap gap-4 items-center mb-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === 'th' ? 'ค้นหาทุกภาษา...' : 'Search all languages...'}
              className="border rounded px-2 py-1 min-w-[260px]"
            />
            <div className="text-sm">
              <button className="linklike" onClick={() => setFilterThai(false)}>
                {lang === 'th' ? 'ทั้งหมด' : 'All'}
              </button>
              &nbsp;|&nbsp;
              <button className="linklike" onClick={() => setFilterThai(true)}>
                {lang === 'th' ? 'เฉพาะภาษาไทย' : 'Thai only'}
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-8 mb-3">
            <label className="text-sm">
              <input
                type="checkbox"
                className="card-check"
                checked={allSelected}
                onChange={toggleSelectAll}
              />
              Select all ({selectedRows.length}/{filtered.length})
            </label>

            <div className="flex items-center gap-8">
              <div>
                <Share
                  url={firstSelected ? firstSelected.url : ''}
                  title={firstSelected ? firstSelected.name || 'Link' : ''}
                  qrCanvasId={firstSelected ? `qr-${firstSelected.id}` : undefined}
                />
                {!firstSelected && (
                  <span className="text-xs" style={{ color: '#6b7280', marginLeft: 8 }}>
                    ( Select at least one item )
                  </span>
                )}
              </div>

              <button
                className="btn btn-blue"
                onClick={batchDownload}
                disabled={!selectedRows.length}
              >
                Download QR cards ({selectedRows.length})
              </button>

              <button className="linklike" onClick={copySelectedLinks}>
                Copy link
              </button>
            </div>
          </div>

          {!filtered.length && <div className="text-sm text-gray-600 mb-3">{i.empty}</div>}

          {/* Cards */}
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((row) => {
              const enlarged = qrEnlargedId === row.id;
              const qrSize = enlarged ? 320 : 192;
              const checked = selectedIds.has(row.id);
              return (
                <li key={row.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(row.id)}
                        style={{ marginRight: 8 }}
                      />
                      Select
                    </label>
                  </div>

                  <div className="text-base font-semibold text-center">{row.name}</div>

                  <div
                    role="button"
                    onClick={() => setQrEnlargedId(enlarged ? null : row.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setQrEnlargedId(enlarged ? null : row.id);
                    }}
                    tabIndex={0}
                    title={enlarged ? 'Shrink QR' : 'Enlarge QR'}
                    style={{ cursor: 'pointer' }}
                    className="qr-center"
                  >
                    <QR url={row.url} size={qrSize} idForDownload={`qr-${row.id}`} />
                  </div>

                  <div className="mt-2 text-center">
                    <a href={row.url} className="underline" target="_blank" rel="noreferrer">
                      {row.url}
                    </a>
                  </div>

                  <div className="mt-2 flex justify-center gap-6 text-sm">
                    <button className="linklike" onClick={() => editRow(row)}>
                      Edit
                    </button>
                    <button className="linklike" onClick={() => deleteRow(row)}>
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* FOOTER */}
      <footer className="site-footer">
        <div>{buildText}</div>
      </footer>

      {/* UPDATE TOAST */}
      <UpdateToast
        lang={lang}
        show={showUpdate}
        onRefresh={() => {
          (window as any).__REFRESH_SW__?.();
          setShowUpdate(false);
        }}
        onSkip={() => setShowUpdate(false)}
      />
    </main>
  );
}

export default AppMain;
