// src/App.tsx — Clean App (tabs, login gate, header/footer, PWA toast)
import React, { useEffect, useMemo, useState } from 'react';
import HeaderBanner from '@/components/HeaderBanner';

// i18n
import { t, Lang } from './i18n';
import AppMain from './components/AppMain';

// Tabs + pages
import TopTabs from './TopTabs';
import Contact from './Contact';

// Layout parts
import Header from './Header';
import Footer from './Footer';

// Pages/parts
import Login from './Login';
import AddLink from './AddLink';
import ImportExport from './ImportExport';
import ExportPage from './Export';
import UpdateToast from './UpdateToast';
import Share from './Share';
import QR from './QR';

// Firebase
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

// URL helper
import { toHttpsOrNull as toHttps } from './url';

// Build constants (from vite.config.ts -> define)
declare const __APP_VERSION__: string | undefined;
declare const __BUILD_PRETTY__: string | undefined; // one declaration only!

type Row = { id: string; name: string; language: string; url: string };

export default function App() {
  return (
    <>
      <HeaderBanner />
      {/* rest of app */}
    </>
  );
}

export default function App() {
  // STATE
  const [lang, setLang] = useState<Lang>('en');
  const i = t(lang);

  const [user, setUser] = useState<any>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [filterThai, setFilterThai] = useState(false);

  const [textPx, setTextPx] = useState<number>(16);
  const [qrEnlargedId, setQrEnlargedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [route, setRoute] = useState<string>(window.location.hash || '#/browse');
  const isBrowse = route.startsWith('#/browse');
  const isAdd = route.startsWith('#/add');
  const isImport = route.startsWith('#/import');
  const isExport = route.startsWith('#/export');
  const isAbout = route.startsWith('#/about');
  const isContact = route.startsWith('#/contact');

  const [showUpdate, setShowUpdate] = useState(false);

  // EFFECTS
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/browse');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--base', `${textPx}px`);
  }, [textPx]);

  // PWA “New version” signal comes from main.tsx (registerSW)
  useEffect(() => {
    const onNeed = () => setShowUpdate(true);
    window.addEventListener('pwa:need-refresh', onNeed);
    return () => window.removeEventListener('pwa:need-refresh', onNeed);
  }, []);

  // Firestore subscribe (only when logged in)
  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    const col = collection(db, 'users', user.uid, 'links');
    const qry = query(col, orderBy('name'));
    const off = onSnapshot(qry, (snap) => {
      const list: Row[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setRows(list);
      setSelectedIds((prev) => {
        const next = new Set<string>();
        for (const id of prev) if (list.find((r) => r.id === id)) next.add(id);
        return next;
      });
    });
    return () => off();
  }, [user]);

  // DERIVED
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

  // HELPERS
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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
      alert('Select at least one item');
      return;
    }
    try {
      await navigator.clipboard.writeText(urls.join('\n'));
    } catch {
      alert('Copy failed');
    }
  };

  const batchDownload = async () => {
    if (!selectedRows.length) {
      alert('Select at least one item');
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

  // ===== LOGIN GATE =====
  if (!user) {
    return (
      <div className="app-shell" style={{ fontSize: textPx }}>
        <Header lang={lang} onLang={setLang} signedIn={false} />
        <main className="app-main">
          <Login
            lang={lang}
            onLang={setLang}
            onSignedIn={() => {
              window.location.hash = '#/browse';
            }}
          />
        </main>

        <UpdateToast
          lang={lang}
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

  // ===== SIGNED-IN VIEW =====
  return (
    <div className="app-shell" style={{ fontSize: textPx }}>
      <Header lang={lang} onLang={setLang} signedIn={true} />

      {/* Tabs directly under banner on ALL signed-in pages */}
      <TopTabs
        lang={lang}
        route={route}
        setRoute={setRoute}
        q={q}
        setQ={setQ}
        filterThai={filterThai}
        setFilterThai={setFilterThai}
      />

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
        ) : isContact ? (
          <Contact />
        ) : isAbout ? (
          <section>
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-sm text-gray-700">
              Thai Good News — a simple PWA for saving, sharing, and printing QR link cards.
            </p>
          </section>
        ) : (
          // BROWSE
          <section>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-8 mb-3">
              <label className="text-sm">
                <input
                  type="checkbox"
                  className="card-check"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
                {lang === 'th' ? 'เลือกทั้งหมด' : 'Select all'} ({selectedRows.length}/
                {filtered.length})
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
                      ({lang === 'th' ? 'เลือกอย่างน้อยหนึ่งรายการ' : 'Select at least one item'})
                    </span>
                  )}
                </div>

                <button
                  className="btn btn-blue"
                  onClick={batchDownload}
                  disabled={!selectedRows.length}
                >
                  {lang === 'th'
                    ? `ดาวน์โหลดการ์ด QR (${selectedRows.length})`
                    : `Download QR cards (${selectedRows.length})`}
                </button>

                <button className="linklike" onClick={copySelectedLinks}>
                  {lang === 'th' ? 'คัดลอกลิงก์' : 'Copy link'}
                </button>
              </div>
            </div>

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
                          onChange={() =>
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              checked ? next.delete(row.id) : next.add(row.id);
                              return next;
                            })
                          }
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
                      title={
                        enlarged
                          ? lang === 'th'
                            ? 'ย่อ QR'
                            : 'Shrink QR'
                          : lang === 'th'
                          ? 'ขยาย QR'
                          : 'Enlarge QR'
                      }
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
      </main>

      <Footer />
    </div>
  );
}
