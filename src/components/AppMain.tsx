import { useState } from 'react';
import AddLink from './AddLink';
import LinksList from './LinksList';
import UpdateToast from '../UpdateToast';
import { useAuth } from '../hooks/useAuth';

// From vite.config.ts
declare const __APP_VERSION__: string | undefined;
declare const __BUILD_PRETTY__: string | undefined;

declare global {
  interface Window {
    __REFRESH_SW__?: (reload?: boolean) => void;
  }
}

function AppMain() {
  const { user } = useAuth();
  const [showUpdate, setShowUpdate] = useState(false);

  const buildText =
    (__APP_VERSION__ ? `v${__APP_VERSION__}` : 'dev') +
    (__BUILD_PRETTY__ ? ` • ${__BUILD_PRETTY__}` : '');

  const canBrowse = !!user;

  return (
    <main className="p-3 max-w-6xl mx-auto app-main">
      {/* Message only when truly locked out */}
      {!canBrowse && (
        <section className="mb-6">
          <p className="text-center text-gray-600">
            Please sign in to add, view, and manage your Thai Good News links.
          </p>
        </section>
      )}

      {/* ADD tab content: only real users can add */}
      {user && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Add</h2>
          <AddLink />
        </section>
      )}

      {/* BROWSE tab content: signed-in or guest can see the list area */}
      {canBrowse && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Browse</h2>
          <LinksList />
        </section>
      )}

      <footer className="site-footer mt-8 pt-3 border-t text-xs text-gray-500 flex justify-between gap-3 flex-wrap">
        <div>Thai Good News PWA</div>
        <div>{buildText}</div>
      </footer>

      <UpdateToast
        show={showUpdate}
        onRefresh={() => {
          window.__REFRESH_SW__?.();
          setShowUpdate(false);
        }}
        onSkip={() => setShowUpdate(false)}
      />
    </main>
  );
}

export default AppMain;
