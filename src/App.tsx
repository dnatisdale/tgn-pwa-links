import React, { useEffect, useMemo, useState } from 'react';
import Banner from './Banner';
import Header from './Header';
import Footer from './Footer';
import Login from './Login';
import AddLink from './AddLink';
import ImportExport from './ImportExport';
import ExportPage from './Export';
import TopTabs from './TopTabs';
import UpdateToast from './UpdateToast';
import Share from './Share';
import QR from './QR';

import { onAuthStateChanged } from 'firebase/auth';
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
import Contact from './Contact';

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

  const isBrowse = route.startsWith('#/browse');
  const isAdd = route.startsWith('#/add');
  const isImport = route.startsWith('#/import');
  const isExport = route.startsWith('#/export');
  const isAbout = route.startsWith('#/about');
  const isContact = route.startsWith('#/contact');

  // auth listener
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  // hash routing
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/browse');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // base font size var
  useEffect(() => {
    document.documentElement.style.setProperty('--base', `${textPx}px`);
  }, [textPx]);

  // PWA update toast
  useEffect(() => {
    const onNeed = () => setShowUpdate(true);
    window.addEventListener('pwa:need-refresh', onNeed);
    return () => window.removeEventListener('pwa:need-refresh', onNeed);
  }, []);

  // set <html lang> and body font class using i18n-provider.lang
  useEffect(() => {
    const current = (lang || 'en').toLowerCase();
    document.documentElement.setAttribute('lang', current);

    document.body.classList.remove('font-en', 'font-th');
    document.body.classList.add(current.startsWith('th') ? 'font-th' : 'font-en');
  }, [lang]);

  // guest mode event (from "Continue as Guest" button)
  useEffect(() => {
    const onGuest = () => {
      localStorage.setItem('tgn.guest', '1');
      setGuestMode(true);
    };
    window.addEventListener('guest:continue', onGuest);
    return () => window.removeEventListener('guest:continue', onGuest);
  }, []);

  // Firestore subscription (only when signed in)
  useEffect(() => {
    if (!user) {
      // guests (or signed-out) see empty list, but still can browse UI
      setRows([]);
      return;
    }
    const col = collection(db, 'users', user.uid, 'links');
    const qry = query(col, orderBy('name'));
    const off = onSnapshot(qry, (snap) => {
      const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(list);
      // keep selection for still-visible rows
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
      alert(lang === 'th' ? 'เลือกอย่างน้อยหนึ่งรายการ' : 'Select at least one item');
      return;
    }
    try {
      await navigator.clipboard.writeText(urls.join('\n'));
    } catch {
      alert(lang === 'th' ? 'คัดลอกล้มเหลว' : 'Copy failed');
    }
  };

  const batchDownload = async () => {
    if (!selectedRows.length) {
      alert(lang === 'th' ? 'เลือกอย่างน้อยหนึ่งรายการ' : 'Select at least one item');
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

  // 🚩 Show Login only when neither signed in nor in guest mode
  if (!user && !guestMode) {
    return (
      <>
        <div className="app-shell" style={{ fontSize: textPx }}>
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
        </div>
      </>
    );
  }

  return (
    <>
      <Banner />
      <div className="app-shell" style={{ fontSize: textPx }}>
        <Header />
        <TopTabs q={q} setQ={setQ} filterThai={filterThai} setFilterThai={setFilterThai} />
        <main className="p-3 max-w-5xl mx-auto app-main">
          {isAdd ? (
            <section>
              <h2 className="text-lg font-semibold mb-2">{t('add')}</h2>
              <AddLink />
            </section>
          ) : isImport ? (
            <section>
              {/* Heading lives inside ImportExport.tsx */}
              <ImportExport />
            </section>
          ) : isExport ? (
            <section>
              {/* Heading lives inside Export.tsx */}
              <ExportPage rows={rows} />
            </section>
          ) : isContact ? (
            <section>
              {/* Heading lives inside Contact.tsx */}
              <Contact />
            </section>
          ) : isAbout ? (
            <section>
              <h2 className="text-lg font-semibold mb-2">{t('about')}</h2>
              <p className="text-sm text-gray-700">{t('aboutText')}</p>
            </section>
          ) : (
            <section>
              <div className="flex flex-wrap items-center gap-8 mb-3">
                <label className="text-sm">
                  <input
                    type="checkbox"
                    className="card-check"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                  {t('selectAll')} ({selectedRows.length}/{filtered.length})
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
                        ({t('selectAtLeastOne')})
                      </span>
                    )}
                  </div>

                  <button
                    className="btn btn-blue"
                    onClick={batchDownload}
                    disabled={!selectedRows.length}
                  >
                    {t('downloadQRCards')} ({selectedRows.length})
                  </button>

                  <button className="linklike" onClick={copySelectedLinks}>
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
                          {t('select')}
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
                        title={enlarged ? t('shrinkQR') : t('enlargeQR')}
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
        <Footer />
      </div>
    </>
  );
}
