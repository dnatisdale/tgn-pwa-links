// src/App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Login from './Login';
import AddLink from './AddLink';
import ImportExport from './ImportExport';
import ExportPage from './Export';
import UpdateToast from './UpdateToast';
import Share from './Share';
import QR from './QR';
import Contact from './Contact';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { useI18n } from './i18n-provider';
import './styles.css';

/* ===== Sticky TopBar with Search + Filter + Logout ===== */
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
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 w-full not-italic" style={{ background: '#2D2A4A' }}>
      <div className="max-w-5xl mx-auto px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-white text-sm sm:text-base font-semibold tracking-wide">
          Thai Good News
        </div>

        {/* Search capsule with Thai-red rim */}
        <div className="relative flex items-center w-full sm:max-w-md">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search all Thai Languages..."
            className="w-full rounded-full border border-[#A51931] pl-4 pr-10 py-2
                       text-gray-900 placeholder-gray-500 focus:outline-none
                       focus:ring-2 focus:ring-[#A51931] bg-white not-italic"
            aria-label="Search all Thai Languages"
          />
          <div
            className="absolute right-3 inset-y-0 flex items-center pointer-events-none"
            aria-hidden="true"
          >
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
          <button
            onClick={onLogout}
            className="ml-4 bg-[#A51931] text-white px-3 py-1 rounded-full text-xs sm:text-sm hover:bg-[#821624] transition not-italic"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
/* ===== /TopBar ===== */

type Row = { id: string; name: string; language: string; url: string };

export default function App() {
  const { lang, t } = useI18n();

  const [user, setUser] = useState<any>(null);
  const [guestMode, setGuestMode] = useState(localStorage.getItem('tgn.guest') === '1');

  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [filterThai, setFilterThai] = useState(false);
  const [textPx, setTextPx] = useState<number>(16);
  const [qrEnlargedId, setQrEnlargedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [route, setRoute] = useState<string>(window.location.hash || '#/browse');
  const [showUpdate, setShowUpdate] = useState(false);

  const isBrowse = route.startsWith('#/browse') || route === '#/' || route === '';
  const isAdd = route.startsWith('#/add');
  const isImport = route.startsWith('#/import');
  const isExport = route.startsWith('#/export');
  const isAbout = route.startsWith('#/about');
  const isContact = route.startsWith('#/contact');

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/browse');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty('--base', `${textPx}px`);
  }, [textPx]);
  useEffect(() => {
    const onNeed = () => setShowUpdate(true);
    window.addEventListener('pwa:need-refresh', onNeed);
    return () => window.removeEventListener('pwa:need-refresh', onNeed);
  }, []);
  useEffect(() => {
    const current = (lang || 'en').toLowerCase();
    document.documentElement.setAttribute('lang', current);
    document.body.classList.remove('font-en', 'font-th');
    document.body.classList.add(current.startsWith('th') ? 'font-th' : 'font-en');
  }, [lang]);
  useEffect(() => {
    const onGuest = () => {
      localStorage.setItem('tgn.guest', '1');
      setGuestMode(true);
    };
    window.addEventListener('guest:continue', onGuest);
    return () => window.removeEventListener('guest:continue', onGuest);
  }, []);

  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    const col = collection(db, 'users', user.uid, 'links');
    const qry = query(col, orderBy('name'));
    const off = onSnapshot(qry, (snap) => {
      const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(list);
      setSelectedIds((prev) => {
        const next = new Set<string>();
        for (const id of prev) if (list.find((r) => r.id === id)) next.add(id);
        return next;
      });
    });
    return () => off();
  }, [user]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((row) => {
      if (
        filterThai &&
        row.language?.toLowerCase() !== 'thai' &&
        row.language?.toLowerCase() !== 'ไทย'
      )
        return false;
      if (!needle) return true;
      return (
        (row.name || '').toLowerCase().includes(needle) ||
        (row.language || '').toLowerCase().includes(needle) ||
        (row.url || '').toLowerCase().includes(needle)
      );
    });
    out.sort(
      (a, b) =>
        (a.language || '').localeCompare(b.language || '') ||
        (a.name || '').localeCompare(b.name || '')
    );
    return out;
  }, [rows, q, filterThai]);

  const allVisibleIds = filtered.map((r) => r.id);
  const selectedRows = filtered.filter((r) => selectedIds.has(r.id));
  const firstSelected = selectedRows[0];
  const allSelected = filtered.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) for (const id of allVisibleIds) next.delete(id);
      else for (const id of allVisibleIds) next.add(id);
      return next;
    });

  const copySelectedLinks = async () => {
    const urls = selectedRows.map((r) => r.url).filter(Boolean);
    if (!urls.length) {
      alert(t('selectAtLeastOne'));
      return;
    }
    try {
      await navigator.clipboard.writeText(urls.join('\n'));
    } catch {
      alert(t('copyFailed'));
    }
  };

  const batchDownload = async () => {
    if (!selectedRows.length) {
      alert(t('selectAtLeastOne'));
      return;
    }
    const mod = await import('./qrCard');
    for (const r of selectedRows) {
      await mod.downloadQrCard({
        qrCanvasId: `qr-${r.id}`,
        url: r.url,
        name: r.name,
        title: 'Thai Good News',
      });
    }
  };

  const editRow = async (r: Row) => {
    const name = prompt(t('title'), r.name ?? '');
    if (name === null) return;
    const language = prompt(t('languageOfContent'), r.language ?? '') ?? '';
    const url = prompt(t('url'), r.url ?? '');
    if (url === null) return;
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (u.protocol !== 'https:') throw new Error();
    } catch {
      alert(t('invalidUrl'));
      return;
    }
    await updateDoc(doc(db, 'users', user.uid, 'links', r.id), {
      name: name.trim(),
      language: language.trim(),
      url: url.trim(),
    });
  };

  const deleteRow = async (r: Row) => {
    if (!confirm(`${t('delete')} "${r.name || r.url}"?`)) return;
    await deleteDoc(doc(db, 'users', user.uid, 'links', r.id));
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(r.id);
      return n;
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('tgn.guest');
    setGuestMode(false);
  };

  if (!user && !guestMode) {
    return (
      <>
        <Header />
        <main className="app-main">
          <Login />
        </main>
        <UpdateToast
          show={showUpdate}
          onRefresh={() => {
            (window as any).__REFRESH_SW__?.();
            setShowUpdate(false);
          }}
          onSkip={() => setShowUpdate(false)}
        />
        <Footer />
      </>
    );
  }

  return (
    <div className="app-shell" style={{ fontSize: textPx }}>
      <Header /> {/* ✅ keeps your banner */}
      <TopBar
        q={q}
        setQ={setQ}
        filterThai={filterThai}
        setFilterThai={setFilterThai}
        onLogout={handleLogout}
      />
      <main className="p-3 max-w-5xl mx-auto app-main not-italic">
        {isAdd ? (
          <section>
            <h2 className="text-lg font-semibold mb-2 not-italic">{t('add')}</h2>
            <AddLink />
          </section>
        ) : isImport ? (
          <section>
            <ImportExport />
          </section>
        ) : isExport ? (
          <section>
            <ExportPage rows={rows} />
          </section>
        ) : isContact ? (
          <section>
            <Contact />
          </section>
        ) : isAbout ? (
          <section>
            <h2 className="text-lg font-semibold mb-2 not-italic">{t('about')}</h2>
            <p className="text-sm text-gray-700 not-italic">{t('aboutText')}</p>
          </section>
        ) : (
          <section>
            <div className="flex flex-wrap items-center gap-8 mb-3">
              <label className="text-sm not-italic">
                <input
                  type="checkbox"
                  className="card-check"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />{' '}
                {t('selectAll')} ({selectedRows.length}/{filtered.length})
              </label>

              <div className="flex items-center gap-8">
                <div>
                  <Share
                    url={firstSelected ? firstSelected.url : ''}
                    title={firstSelected ? firstSelected.name || 'Link' : ''}
                  />
                  {!firstSelected && (
                    <span className="text-xs" style={{ color: '#6b7280', marginLeft: 8 }}>
                      ({t('selectAtLeastOne')})
                    </span>
                  )}
                </div>

                <button
                  className="btn btn-blue not-italic"
                  onClick={batchDownload}
                  disabled={!selectedRows.length}
                >
                  {t('downloadQRCards')} ({selectedRows.length})
                </button>

                <button className="linklike not-italic" onClick={copySelectedLinks}>
                  {t('copyLink')}
                </button>
              </div>
            </div>

            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                          onChange={() =>
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              checked ? next.delete(row.id) : next.add(row.id);
                              return next;
                            })
                          }
                          style={{ marginRight: 8 }}
                        />
                        {t('select')}
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
                      title={enlarged ? t('shrinkQR') : t('enlargeQR')}
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
                        {t('edit')}
                      </button>
                      <button className="linklike" onClick={() => deleteRow(row)}>
                        {t('delete')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
      <UpdateToast
        show={showUpdate}
        onRefresh={() => {
          (window as any).__REFRESH_SW__?.();
          setShowUpdate(false);
        }}
        onSkip={() => setShowUpdate(false)}
      />
      <Footer />
    </div>
  );
}
