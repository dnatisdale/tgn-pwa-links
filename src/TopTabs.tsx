import React from 'react';
import { useI18n } from './i18n-provider';

type Props = {
  q: string;
  setQ: (s: string) => void;
  filterThai: boolean;
  setFilterThai: (b: boolean) => void;
};

export default function TopTabs({ q, setQ, filterThai, setFilterThai }: Props) {
  const { t } = useI18n();
  const route = window.location.hash || '#/browse';
  const go = (hash: string) => {
    if (window.location.hash !== hash) window.location.hash = hash;
  };

  const Tab = ({ active, label, to }: { active: boolean; label: string; to: string }) => (
    <button
      className={`tab ${active ? 'tab-active' : ''}`}
      onClick={() => go(to)}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </button>
  );

  const isBrowse = route.startsWith('#/browse');

  return (
    <div className="tabs-bar">
      <button
        className={`btn btn-red add-btn ${route.startsWith('#/add') ? 'add-active' : ''}`}
        onClick={() => go('#/add')}
      >
        {t('add')}
      </button>

      <nav className="tabs-list" aria-label="Primary">
        <Tab active={route.startsWith('#/browse')} label={t('browse')} to="#/browse" />
        <Tab active={route.startsWith('#/import')} label={t('import')} to="#/import" />
        <Tab active={route.startsWith('#/export')} label={t('export')} to="#/export" />
        <Tab active={route.startsWith('#/contact')} label={t('contact')} to="#/contact" />
        <Tab active={route.startsWith('#/about')} label={t('about')} to="#/about" />
      </nav>

      {isBrowse ? (
        <div className="tabs-search">
          <div className="filter-links">
            <button
              className={!filterThai ? 'linklike active' : 'linklike'}
              onClick={() => setFilterThai(false)}
            >
              {t('all')}
            </button>
            <span className="sep">|</span>
            <button
              className={filterThai ? 'linklike active' : 'linklike'}
              onClick={() => setFilterThai(true)}
            >
              {t('thai')}
            </button>
          </div>
          {/* Search Field — Thai-red outline and red magnifying glass */}
          <div className="relative flex items-center w-full max-w-md mx-auto my-4">
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-lg border-2 border-[#A51931] px-4 py-2 pr-10 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A51931]"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-3 w-5 h-5 text-[#A51931] pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z"
              />
            </svg>
          </div>
          {/*<input */}
          {/*  value={q} */}
          {/*  onChange={(e) => setQ(e.target.value)} */}
          {/*  placeholder={t('search')} */}
          {/*  className="searchbar search-pill-red" */}
        {/*  /> */}
      {/*  </div> */}
      ) : (
        <div />
      )}
    </div>
  );
}
