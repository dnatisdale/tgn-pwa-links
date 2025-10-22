// src/TopTabs.tsx — ADD (big red) on left, middle tabs centered, search on right (Browse only)
import React from 'react';
import { Lang } from './i18n';

type Props = {
  lang: Lang;
  route: string; // '#/add' | '#/browse' | '#/import' | '#/export' | '#/contact' | '#/about'
  setRoute: (r: string) => void;
  q: string;
  setQ: (s: string) => void;
  filterThai: boolean;
  setFilterThai: (b: boolean) => void;
};

export default function TopTabs({
  lang,
  route,
  setRoute,
  q,
  setQ,
  filterThai,
  setFilterThai,
}: Props) {
  const L = {
    add: lang === 'th' ? 'เพิ่ม' : 'ADD',
    browse: lang === 'th' ? 'เรียกดู' : 'Browse',
    import: lang === 'th' ? 'นำเข้า' : 'Import',
    export: lang === 'th' ? 'ส่งออก' : 'Export',
    contact: lang === 'th' ? 'ติดต่อ' : 'Contact',
    about: lang === 'th' ? 'เกี่ยวกับ' : 'About',
    search: lang === 'th' ? 'ค้นหาทุกภาษา...' : 'Search all languages...',
    all: lang === 'th' ? 'ทั้งหมด' : 'All',
    thai: lang === 'th' ? 'เฉพาะภาษาไทย' : 'Thai only',
  };

  const go = (hash: string) => {
    if (window.location.hash !== hash) window.location.hash = hash;
    setRoute(hash);
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
      {/* LEFT: big red ADD */}
      <button
        className={`btn btn-red add-btn ${route.startsWith('#/add') ? 'add-active' : ''}`}
        onClick={() => go('#/add')}
        aria-current={route.startsWith('#/add') ? 'page' : undefined}
      >
        {L.add}
      </button>

      {/* MIDDLE: centered tabs */}
      <nav className="tabs-list" aria-label="Primary">
        <Tab active={route.startsWith('#/browse')} label={L.browse} to="#/browse" />
        <Tab active={route.startsWith('#/import')} label={L.import} to="#/import" />
        <Tab active={route.startsWith('#/export')} label={L.export} to="#/export" />
        <Tab active={route.startsWith('#/contact')} label={L.contact} to="#/contact" />
        <Tab active={route.startsWith('#/about')} label={L.about} to="#/about" />
      </nav>

      {/* RIGHT: filters + search (Browse only) */}
      {isBrowse ? (
        <div className="tabs-search">
          <div className="filter-links">
            <button
              className={!filterThai ? 'linklike active' : 'linklike'}
              onClick={() => setFilterThai(false)}
            >
              {L.all}
            </button>
            <span className="sep">|</span>
            <button
              className={filterThai ? 'linklike active' : 'linklike'}
              onClick={() => setFilterThai(true)}
            >
              {L.thai}
            </button>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={L.search}
            className="searchbar search-pill-red"
          />
        </div>
      ) : (
        <div /> // keep space on non-browse pages
      )}
    </div>
  );
}
