// src/TopTabs.tsx
import React from 'react';
import { useI18n } from './i18n-provider';

type TabKey = 'BROWSE' | 'ADD' | 'IMPORT' | 'EXPORT' | 'CONTACT' | 'ABOUT';

type Props = {
  /** Optional lifted-state API (works with hash routing) */
  activeTab?: TabKey;
  setActiveTab?: (t: TabKey) => void;
};

// helpers to translate between hash and TabKey
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
      window.location.hash = nextHash; // deep-linking
    }
    setActiveTab?.(tab);
  };

  const TabBtn = ({ active, label, to }: { active: boolean; label: string; to: TabKey }) => (
    <button
      className={[
        'px-5 py-2 rounded-full border transition-colors duration-200 not-italic',
        active
          ? 'bg-[#2D2A4A] border-[#2D2A4A] text-white shadow-sm' // Thai blue + white text ✅
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
      <div className="flex items-center gap-3 my-3">
        {/* ADD button stays on the left */}
        <button
          className={[
            'px-4 py-2 rounded-xl border not-italic',
            currentTab === 'ADD'
              ? 'bg-[#A51931] text-white border-black'
              : 'bg-[#A51931] text-white border-black opacity-95',
          ].join(' ')}
          onClick={() => go('ADD')}
        >
          {tOr('add', 'Add')}
        </button>

        <nav className="flex items-center gap-3" aria-label="Primary">
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
  );
}
