// src/components/AppMain.tsx — fixed & simplified main body

import AddLink from '../AddLink';
import ImportExport from '../ImportExport';
import ExportPage from '../Export';
import UpdateToast from '../UpdateToast';
import Share from '../Share';
import QR from '../QR';
import { useAppLogic } from '../hooks/useAppLogic';
import { Row } from '../hooks/useAppLogic';
import { toHttpsOrNull as toHttps } from '../url';
import { db } from '../firebase';
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
    setLang, // (not used here yet but kept for future toggles)
    user,
    rows,
    q,
    setQ,
    filterThai,
    setFilterThai,
    textPx,
    setTextPx, // (not used here in this file but part of global logic)
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
          {/* ===================== Search & Filter ===================== */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Capsule pill search with tiny Thai-red rim */}
            <div className="relative flex items-center min-w-[260px] w-full sm:max-w-md">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                // Dan’s preferred text:
                placeholder={'Search all Thai Languages...'}
                className="w-full rounded-full border border-[#A51931] pl-4 pr-12 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A51931]"
              />
              {/* Magnifying glass inside the pill, right side */}
              <div
                className="absolute right-2 inset-y-0 w-8 rounded-full flex items-center justify-center pointer-events-none"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-[#A51931]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {/* Quick filter links */}
            <div className="text-sm">
              <button
                className="linklike"
                onClick={() => setFilterThai(false)}
                aria-pressed={!filterThai}
              >
                {lang === 'th' ? 'ทั้งหมด' : 'All'}
              </button>
              &nbsp;|&nbsp;
              <button
                className="linklike"
                onClick={() => setFilterThai(true)}
                aria-pressed={filterThai}
              >
                {lang === 'th' ? 'เฉพาะภาษาไทย' : 'Thai only'}
              </button>
            </div>
          </div>

          {/* ===================== Toolbar ===================== */}
          <div className="flex flex-wrap items-center gap-8 mb-3">
            <label className="text-sm">
              <input
                type="checkbox"
                className="card-check"
                checked={allSelected}
                onChange={toggleSelectAll}
              />{' '}
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

          {/* ===================== Empty State ===================== */}
          {!filtered.length && <div className="text-sm text-gray-600 mb-3">{i.empty}</div>}

          {/* ===================== Card Grid ===================== */}
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

      {/* ===================== FOOTER ===================== */}
      <footer className="site-footer">
        <div>{buildText}</div>
      </footer>

      {/* ===================== UPDATE TOAST ===================== */}
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
