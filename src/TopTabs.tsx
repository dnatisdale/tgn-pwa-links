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

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search')}
            className="searchbar search-pill-red"
          />
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}
