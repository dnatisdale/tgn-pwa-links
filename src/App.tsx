// src/App.tsx
import React, { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import TopTabs from './TopTabs';
import ImportExport from './ImportExport';
import ExportPage from './Export';
import Contact from './Contact';
import AddLink from './components/AddLink';
import LinksList from './components/LinksList';
import Login from './Login';
import { db } from './firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useI18n } from './i18n-provider';
import { useAuth } from './hooks/useAuth';

// A row shape compatible with ExportPage
type ExportRow = {
  id: string;
  name: string;
  url: string;
  language?: string;
};

const [rows, setRows] = useState<ExportRow[]>([]);

export default function App() {
  const { t, lang } = useI18n();
  const { user, isGuest, loading } = useAuth();

  const tOr = (k: any, fb: string) => {
    try {
      const v = t?.(k as any);
      const s = (v ?? '').toString().trim();
      return s || fb;
    } catch {
      return fb;
    }
  };

  const [rows, setRows] = useState<Row[]>([]);
  const [route, setRoute] = useState<string>(window.location.hash || '#/browse');

  // Hash routing
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/browse');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // <html lang="...">
  useEffect(() => {
    const current = (lang || 'en').toLowerCase();
    document.documentElement.setAttribute('lang', current);
  }, [lang]);

  // Live rows for Export page – only when signed in
  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }

    const qy = query(collection(db, 'users', user.uid, 'links'), orderBy('url'));

    const off = onSnapshot(qy, (snap) => {
      const list: ExportRow[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name ?? '',
          url: data.url ?? '',
          language: data.language,
        };
      });
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

  // While auth state is loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center text-gray-500">Loading…</main>
        <Footer />
      </div>
    );
  }

  // Not signed in and not guest → show full Login UI
  if (!user && !isGuest) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-4">
          <Login />
        </main>
        <Footer />
      </div>
    );
  }

  // Signed in OR guest → main app shell
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TopTabs />
      <main className="flex-1 p-3 max-w-6xl mx-auto">
        {isAdd ? (
          user ? (
            <section>
              <h2 className="text-lg font-semibold mb-2 not-italic">{tOr('add', 'Add')}</h2>
              <AddLink />
            </section>
          ) : (
            <p className="text-center text-gray-500">Sign in to add links.</p>
          )
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
          // Default: Browse
          <section aria-label="Browse list" className="mt-4">
            <LinksList />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
