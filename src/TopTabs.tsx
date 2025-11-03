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
  // safe i18n
  let t = (k: string) => k;
  try {
    const i = useI18n();
    if (i && typeof i.t === 'function') t = i.t;
  } catch {}

  const tOr = (k: string, fb: string) => {
    try {
      const v = t?.(k);
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

  const baseBtn =
    'inline-flex items-center justify-center select-none not-italic transition-colors duration-200 border rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black';

  const TabBtn = ({ active, label, to }: { active: boolean; label: string; to: TabKey }) => (
    <button
      className={[
        baseBtn,
        // responsive sizing
        'text-sm sm:text-base px-3 py-1.5 sm:px-5 sm:py-2',
        active
          ? 'bg-[#2D2A4A] border-[#2D2A4A] text-white shadow-sm' // Thai blue + white
          : 'bg-white border-gray-300 text-[#2D2A4A] hover:bg-gray-50',
      ].join(' ')}
      onClick={() => go(to)}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full">
      {/* Centered container, wraps nicely on phones, constrained on wide screens */}
      <div className="mx-auto max-w-5xl px-2">
        <div
          className="
            flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4
            my-3
          "
        >
          {/* Keep ADD as the first chip, styled in Thai red, still part of the centered row */}
          <button
            className={[
              baseBtn,
              'text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2',
              currentTab === 'ADD'
                ? 'bg-[#A51931] text-white border-black'
                : 'bg-[#A51931] text-white/95 border-black hover:text-white',
            ].join(' ')}
            onClick={() => go('ADD')}
          >
            {tOr('add', 'Add')}
          </button>

          <nav
            className="
              flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4
            "
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
          </nav>
        </div>
      </div>
    </div>
  );
}
