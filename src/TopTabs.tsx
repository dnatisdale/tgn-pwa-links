import React from 'react';
import { useI18n } from './i18n-provider';

type TabKey = 'BROWSE' | 'ADD' | 'IMPORT' | 'EXPORT' | 'CONTACT' | 'ABOUT';

type Props = {
  q: string;
  setQ: (s: string) => void;
  filterThai: boolean;
  setFilterThai: (b: boolean) => void;

  /** Optional lifted-state API (works alongside hash routing).
   * If provided, TopTabs will call setActiveTab and also update location.hash for deep-links.
   */
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

export default function TopTabs({
  q,
  setQ,
  filterThai,
  setFilterThai,
  activeTab,
  setActiveTab,
}: Props) {
  // --- safe i18n (prevents "undefined") ---
  let t = (k: string) => k;
  try {
    const i = useI18n();
    if (i && typeof i.t === 'function') t = i.t;
  } catch {
    /* ignore if provider not mounted */
  }
  const tOr = (k: string, fb: string) => {
    try {
      const v = t?.(k);
      return (v ?? '').toString().trim() || fb;
    } catch {
      return fb;
    }
  };

  // Determine current tab (prefer lifted state if provided, else from hash)
  const currentHash =
    typeof window !== 'undefined' ? window.location.hash || '#/browse' : '#/browse';
  const currentTab: TabKey = activeTab ?? hashToTab(currentHash);

  const go = (tab: TabKey) => {
    const nextHash = tabToHash(tab);
    // update hash for deep-linking/bookmarks
    if (typeof window !== 'undefined' && window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    // also notify parent if they provided lifted state
    setActiveTab?.(tab);
  };

  const Tab = ({ active, label, to }: { active: boolean; label: string; to: TabKey }) => (
    <button
      className={`tab ${active ? 'tab-active' : ''} not-italic`}
      onClick={() => go(to)}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </button>
  );

  const isBrowse = currentTab === 'BROWSE';

  return (
    <div className="tabs-bar">
      <button
        className={`btn btn-red add-btn not-italic ${currentTab === 'ADD' ? 'add-active' : ''}`}
        onClick={() => go('ADD')}
      >
        {tOr('add', 'Add')}
      </button>

      <nav className="tabs-list" aria-label="Primary">
        <Tab active={currentTab === 'BROWSE'} label={tOr('browse', 'Browse')} to="BROWSE" />
        <Tab active={currentTab === 'IMPORT'} label={tOr('import', 'Import')} to="IMPORT" />
        <Tab active={currentTab === 'EXPORT'} label={tOr('export', 'Export')} to="EXPORT" />
        <Tab active={currentTab === 'CONTACT'} label={tOr('contact', 'Contact')} to="CONTACT" />
        <Tab active={currentTab === 'ABOUT'} label={tOr('about', 'About')} to="ABOUT" />
      </nav>

      {isBrowse ? (
        <div className="tabs-search">
          <div className="filter-links">
            <button
              className={`${!filterThai ? 'active' : ''} linklike not-italic`}
              onClick={() => setFilterThai(false)}
            >
              {tOr('all', 'All')}
            </button>
            <span className="sep">|</span>
            <button
              className={`${filterThai ? 'active' : ''} linklike not-italic`}
              onClick={() => setFilterThai(true)}
            >
              {tOr('thai', 'Thai')}
            </button>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tOr('search', 'Search')}
            className="searchbar search-pill-red not-italic"
            aria-label={tOr('search', 'Search')}
          />
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}
