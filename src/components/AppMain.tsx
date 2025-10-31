// src/components/AppMain.tsx — TopBar + Search + Logout + Main content (TS props fixed)

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

declare global {
  interface Window {
    __REFRESH_SW__?: (reload?: boolean) => void;
  }
}

declare const __APP_VERSION__: string | undefined;
declare const __BUILD_PRETTY__: string | undefined;

function TopBar({
  q,
  setQ,
  filterThai,
  setFilterThai,
  onLogout,
}: {
  q: string;
  setQ: (s: string) => void;
  filterThai: boolean;
  setFilterThai: (v: boolean) => void;
  onLogout?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 w-full not-italic" style={{ background: '#2D2A4A' }}>
      <div className="max-w-5xl mx-auto px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: App title */}
        <div className="text-white text-sm sm:text-base font-semibold tracking-wide">
          Thai Good News
        </div>

        {/* Middle: Search pill */}
        <div className="relative flex items-center w-full sm:max-w-md">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search all Thai Languages..."
            className="w-full rounded-full border border-[#A51931] pl-4 pr-10 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A51931] bg-white not-italic"
          />
          <div className="absolute right-3 inset-y-0 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A51931"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Right: Filter + Logout */}
        <div className="flex items-center gap-4 text-sm text-white">
          <button
            onClick={() => setFilterThai(false)}
            className={`${!filterThai ? 'underline' : 'opacity-80 hover:opacity-100'} not-italic`}
          >
            All
          </button>
          <span className="opacity-60">|</span>
          <button
            onClick={() => setFilterThai(true)}
            className={`${filterThai ? 'underline' : 'opacity-80 hover:opacity-100'} not-italic`}
          >
            Thai only
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="ml-4 bg-[#A51931] text-white px-3 py-1 rounded-full text-xs sm:text-sm hover:bg-[#821624] transition not-italic"
            >
              Log Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function AppMain({ user, onLogout }: { user: any; onLogout?: () => void }) {
  const {
    lang,
    rows,
    q,
    setQ,
    filterThai,
    setFilterThai,
    qrEnlargedId,
    setQrEnlargedId,
    selectedIds,
    setSelectedIds,
    showUpdate,
    setShowUpdate,
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

  const buildText =
    (__APP_VERSION__ ? `v${__APP_VERSION__}` : 'dev') +
    (__BUILD_PRETTY__ ? ` • ${__BUILD_PRETTY__}` : '');

  return (
    <div className="min-h-screen flex flex-col not-italic">
      <TopBar
        q={q}
        setQ={setQ}
        filterThai={filterThai}
        setFilterThai={setFilterThai}
        onLogout={onLogout}
      />

      <main className="p-3 max-w-5xl mx-auto w-full app-main not-italic">
        {isAdd ? (
          // ❌ Removed unsupported prop `lang`
          <AddLink />
        ) : isImport ? (
          // ❌ Removed unsupported prop `lang`
          <ImportExport />
        ) : isExport ? (
          // ❌ Removed unsupported prop `lang` – this page only needs rows
          <ExportPage rows={rows} />
        ) : isAbout ? (
          <section>
            <h2 className="text-lg font-semibold mb-2 not-italic">About</h2>
            <p className="text-sm text-gray-700 not-italic">
              Thai Good News — a simple PWA for saving, sharing, and printing QR link cards.
            </p>
          </section>
        ) : (
          <section>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-8 mb-3 mt-2 not-italic">
              <label className="text-sm not-italic">
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
                  {/* ❌ Removed unsupported prop `qrCanvasId` */}
                  <Share
                    url={firstSelected ? firstSelected.url : ''}
                    title={firstSelected ? firstSelected.name || 'Link' : ''}
                  />
                </div>

                <button
                  className="btn btn-blue not-italic"
                  onClick={batchDownload}
                  disabled={!selectedRows.length}
                >
                  Download QR cards ({selectedRows.length})
                </button>

                <button className="linklike not-italic" onClick={copySelectedLinks}>
                  Copy link
                </button>
              </div>
            </div>

            {/* Empty */}
            {!filtered.length && (
              <div className="text-sm text-gray-600 mb-3 not-italic">No items</div>
            )}

            {/* Cards */}
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 not-italic">
              {filtered.map((row) => {
                const enlarged = qrEnlargedId === row.id;
                const qrSize = enlarged ? 320 : 192;
                const checked = selectedIds.has(row.id);
                return (
                  <li key={row.id} className="card not-italic">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm not-italic">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(row.id)}
                          style={{ marginRight: 8 }}
                        />
                        Select
                      </label>
                    </div>

                    <div className="text-base font-semibold text-center not-italic">{row.name}</div>

                    <div
                      role="button"
                      onClick={() => setQrEnlargedId(enlarged ? null : row.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setQrEnlargedId(enlarged ? null : row.id);
                      }}
                      tabIndex={0}
                      title={enlarged ? 'Shrink QR' : 'Enlarge QR'}
                      className="qr-center cursor-pointer"
                    >
                      <QR url={row.url} size={qrSize} idForDownload={`qr-${row.id}`} />
                    </div>

                    <div className="mt-2 text-center not-italic">
                      <a
                        href={row.url}
                        className="underline not-italic"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {row.url}
                      </a>
                    </div>

                    <div className="mt-2 flex justify-center gap-6 text-sm not-italic">
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

        <footer className="site-footer mt-8 text-sm text-gray-600 not-italic">{buildText}</footer>
      </main>

      {/* Keep UpdateToast here only if you mount AppMain directly */}
      <UpdateToast
        show={showUpdate}
        onRefresh={() => {
          (window as any).__REFRESH_SW__?.();
          setShowUpdate(false);
        }}
        onSkip={() => setShowUpdate(false)}
      />
    </div>
  );
}

export default AppMain;
