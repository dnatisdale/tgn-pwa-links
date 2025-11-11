// src/App.tsx

import React, { useEffect, useState } from 'react';

import Header from './Header';
import Footer from './Footer';
import TopTabs from './TopTabs';
import ImportExport from './ImportExport';
import ExportPage from './Export';
import Contact from './Contact';
import About from './About';
import AddLink from './components/AddLink';
import LinksList from './components/LinksList';
import Login from './Login';

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

import { useI18n } from './i18n-provider';
import AdminPanel from './AdminPanel';
import { useAuth } from './hooks/useAuth';
import { isAdminUser } from './adminConfig';

// Shape for rows passed into ExportPage
type ExportRow = {
  id: string;
  name: string;
  url: string;
  language: string; // required
};

export default function App() {
  const { t, lang } = useI18n();
  const { user, loading } = useAuth();

  const [rows, setRows] = useState<ExportRow[]>([]);
  const [route, setRoute] = useState<string>(window.location.hash || '#/browse');

  const isAdmin = isAdminUser(user?.email || null);

  const tOr = (k: string, fb: string) => {
    try {
      const v = t?.(k as any);
      const s = (v ?? '').toString().trim();
      return s || fb;
    } catch {
      return fb;
    }
  };

  // Hash routing for tabs (#/add, #/browse, etc.)
  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash || '#/browse');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Derived route flags
  const isBrowse = route.startsWith('#/browse') || route === '' || route === '#/';
  const isAdd = route.startsWith('#/add');
  const isImport = route.startsWith('#/import');
  const isExport = route.startsWith('#/export');
  const isContact = route.startsWith('#/contact');
  const isAbout = route.startsWith('#/about');
  const isAdminRoute = route.startsWith('#/admin');

  // Keep <html lang="..."> in sync
  useEffect(() => {
    const current = (lang || 'en').toLowerCase();
    document.documentElement.setAttribute('lang', current);
  }, [lang]);

  // Load rows for Export page (only when logged in)
  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }

    const qy = query(collection(db, 'users', user.uid, 'links'), orderBy('url'));

    const unsub = onSnapshot(qy, (snap: QuerySnapshot<DocumentData>) => {
      const list: ExportRow[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name ?? data.title ?? '',
          url: data.url ?? '',
          language: data.language ?? data.iso3 ?? '',
        };
      });
      setRows(list);
    });

    return () => unsub();
  }, [user]);

  // While we don't yet know auth state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center text-gray-500">Loading…</main>
        <Footer />
      </div>
    );
  }

  // Not signed in → show login screen
  if (!user) {
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

  // Signed in → main shell
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TopTabs isAdmin={isAdmin} />
      <main className="flex-1 p-3 max-w-6xl mx-auto">
        {isAdminRoute && isAdmin ? (
          <AdminPanel />
        ) : isAdd ? (
          <section>
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
            <About />
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
