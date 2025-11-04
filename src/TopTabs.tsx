// src/TopTabs.tsx
import React from 'react';
import { useI18n } from './i18n-provider';

type TabKey = 'BROWSE' | 'ADD' | 'IMPORT' | 'EXPORT' | 'CONTACT' | 'ABOUT';

type Props = {
  activeTab?: TabKey;
  setActiveTab?: (t: TabKey) => void;
};

// hash helpers
const hashToTab = (hash: string): TabKey => {
  if (hash.startsWith('#/add')) return 'ADD';
  if (hash.startsWith('#/import')) return 'IMPORT';
  if (hash.startsWith('#/export')) return 'EXPORT';
  if (hash.startsWith('#/contact')) return 'CONTACT';
  if (hash.startsWith('#/about')) return 'ABOUT';
  return 'BROWSE';
};
const tabToHash = (t: TabKey) =>
  t === 'ADD'
    ? '#/add'
    : t === 'IMPORT'
    ? '#/import'
    : t === 'EXPORT'
    ? '#/export'
    : t === 'CONTACT'
    ? '#/contact'
    : t === 'ABOUT'
    ? '#/about'
    : '#/browse';

export default function TopTabs({ activeTab, setActiveTab }: Props) {
  // ✅ safe i18n getter that accepts any string key (avoids TS union error)
  let t: (k: string) => string = (k: string) => k;
  try {
    const i = useI18n() as any;
    if (i && typeof i.t === 'function') t = (k: string) => i.t(k as any);
  } catch {}

  const tOr = (k: string, fb: string) => {
    try {
      const v = t(k);
      return (v ?? '').toString().trim() || fb;
    } catch {
      return fb;
    }
  };

  const currentHash =
    typeof window !== 'undefined' ? window.location.hash || '#/browse' : '#/browse';
  const currentTab: TabKey = activeTab ?? hashToTab(currentHash);

  const go = (tab: TabKey) => {
    const nextHash = tabToHash(tab);
    if (typeof window !== 'undefined' && window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    setActiveTab?.(tab);
  };

  // 🔎 Search state + broadcast to the app filter
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('app:search', { detail: query }));
  }, [query]);

  // Keyboard: "/" opens search, "Esc" closes
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => {
          (document.getElementById('main-search-input') as HTMLInputElement | null)?.focus();
        }, 0);
      }
      if (e.key === 'Escape' && isSearchOpen) setIsSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSearchOpen]);

  // Keep your original tab button styling
  const TabBtn = ({ active, label, to }: { active: boolean; label: string; to: TabKey }) => (
    <button
      className={[
        'group inline-flex items-center justify-center select-none not-italic transition-colors duration-200 border rounded-full',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black',
        'text-sm sm:text-base px-3 py-1.5 sm:px-5 sm:py-2',
        active
          ? 'bg-[#2D2A4A] border-[#2D2A4A] text-white shadow-sm'
          : 'bg-white border-gray-300 text-[#2D2A4A] hover:bg-gray-50',
      ].join(' ')}
      onClick={() => go(to)}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={[
          'motion-safe:transition-transform motion-safe:duration-150',
          'group-hover:scale-[1.06] group-focus-visible:scale-[1.06] active:scale-[1.06]',
        ].join(' ')}
      >
        {label}
      </span>
    </button>
  );

  return (
    <div className="w-full">
      <div className="mx-auto max-w-5xl px-2">
        <div className="my-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
          {/* ADD (Thai red) */}
          <button
            className={[
              'group inline-flex items-center justify-center select-none not-italic border rounded-xl',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black',
              'text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2',
              'bg-[#A51931] text-white border-black hover:text-white',
            ].join(' ')}
            onClick={() => go('ADD')}
          >
            <span className="motion-safe:transition-transform motion-safe:duration-150 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] active:scale-[1.06]">
              {tOr('add', 'Add')}
            </span>
          </button>

          {/* Primary nav */}
          <nav
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4"
            aria-label="Primary"
          >
            <TabBtn active={currentTab === 'BROWSE'} label={tOr('browse', 'Browse')} to="BROWSE" />
            <TabBtn active={currentTab === 'IMPORT'} label={tOr('import', 'Import')} to="IMPORT" />
            <TabBtn active={currentTab === 'EXPORT'} label={tOr('export', 'Export')} to="EXPORT" />
            <TabBtn
              active={currentTab === 'CONTACT'}
              label={tOr('contact', 'Contact')}
              to="CONTACT"
            />
            <TabBtn active={currentTab === 'ABOUT'} label={tOr('about', 'About')} to="ABOUT" />

            {/* 🔍 Your ONE search (round button + Thai-red input) */}
            <div className="flex items-center gap-2">
              {/* Round magnifying glass button */}
              <button
                type="button"
                onClick={() => {
                  const next = !isSearchOpen;
                  setIsSearchOpen(next);
                  if (next) {
                    setTimeout(() => {
                      (
                        document.getElementById('main-search-input') as HTMLInputElement | null
                      )?.focus();
                    }, 0);
                  }
                }}
                aria-controls="main-search-input"
                aria-expanded={isSearchOpen}
                className={[
                  'inline-flex items-center justify-center',
                  'h-10 w-10 rounded-full',
                  'bg-[#A51931] text-white border border-black shadow',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black',
                  'active:scale-[0.98] transition',
                ].join(' ')}
                title={tOr('search', 'Search')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 0 0 1.57-4.23A6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.505 4.505 0 0 1 9.5 14Z"
                  />
                </svg>
              </button>

              {/* Expanding input with Thai-red border */}
              <input
                id="main-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`${tOr('searchAll', 'Search all languages…')} / ค้นหา…`}
                className={[
                  'top-search-input', // <-- marks this as the one to keep visible
                  'h-10 rounded-xl border-2 px-3 outline-none bg-white',
                  'border-[#A51931] focus:ring-2 focus:ring-[#A51931]',
                  'text-gray-900 placeholder-gray-400 not-italic',
                  isSearchOpen ? 'w-64 md:w-72 opacity-100' : 'w-0 md:w-0 opacity-0',
                  'transition-all duration-200',
                  'md:pl-3 md:pr-3',
                ].join(' ')}
                inputMode="search"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                tabIndex={isSearchOpen ? 0 : -1}
                aria-hidden={!isSearchOpen}
              />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
