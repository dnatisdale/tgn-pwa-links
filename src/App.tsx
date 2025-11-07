// src/App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import TopTabs from './TopTabs';
import ImportExport from './ImportExport';
import ExportPage from './Export';
import Contact from './Contact';
import AddLink from './components/AddLink';
import LinksList from './components/LinksList';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useI18n } from './i18n-provider';

type Row = { id: string; name?: string; language?: string; url: string };

export default function App() {
  const { t, lang } = useI18n();

  // safe translate helper
  const tOr = (k: string, fb: string) => {
    try {
      const v = t?.(k);
      return (v ?? '').toString().trim() || fb;
    } catch {
      return fb;
    }
  };

  const [user, setUser] = useState<any>(null);
  const [guestMode, setGuestMode] = useState(localStorage.getItem('tgn.guest') === '1');

  const [rows, setRows] = useState<Row[]>([]);
  const [route, setRoute] = useState<string>(window.location.hash || '#/browse');

  // auth
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  // hash routing
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/browse');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // language attribute
  useEffect(() => {
    const current = (lang || 'en').toLowerCase();
    document.documentElement.setAttribute('lang', current);
  }, [lang]);

  // live rows (if you still use them in ExportPage, etc.)
  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    const qy = query(collection(db, 'users', user.uid, 'links'), orderBy('url'));
    const off = onSnapshot(qy, (snap) => {
      const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(list);
    });
    return () => off();
  }, [user]);

  const isBrowse = route.startsWith('#/browse');
  const isAdd = route.startsWith('#/add');
  const isImport = route.startsWith('#/import');
  const isExport = route.startsWith('#/export');
  const isAbout = route.startsWith('#/about');
  const isContact = route.startsWith('#/contact');

  // show sign-in or main
  if (!user && !guestMode) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-4">
          {/* Your Login component here if you want gating; or temporary guest link */}
          <p className="text-center text-gray-600">Please sign in.</p>
          <div className="text-center mt-4">
            <button
              className="btn btn-blue"
              onClick={() => {
                localStorage.setItem('tgn.guest', '1');
                setGuestMode(true);
              }}
            >
              Continue as Guest
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TopTabs />
      <main className="flex-1 p-3 max-w-6xl mx-auto">
        {isAdd ? (
          <section>
            <h2 className="text-lg font-semibold mb-2 not-italic">{tOr('add', 'Add')}</h2>
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
            <h2 className="text-lg font-semibold mb-2 not-italic">{tOr('about', 'About')}</h2>
            <p className="text-sm text-gray-700 not-italic">
              {tOr('aboutText', 'This app helps you organize and share links.')}
            </p>
          </section>
        ) : (
          <section aria-label="Browse list" className="mt-4">
            <LinksList />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
