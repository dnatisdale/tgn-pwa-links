// src/components/LanguageSidebar.tsx
import React from 'react';

type LinkLike = {
  id: string;
  language?: string;
};

type LanguageInfo = {
  code: string;
  nameEn: string;
  nameTh: string;
  count: number;
};

type Props = {
  links: LinkLike[];
  open: boolean;
  onClose: () => void;
  activeLangs: string[]; // selected language codes
  onToggleLang: (code: string) => void;
};

const languageLabel = (code: string): LanguageInfo['nameEn'] => {
  // Minimal fallback; you can expand this mapping
  switch (code.toLowerCase()) {
    case 'th':
      return 'Thai';
    case 'en':
      return 'English';
    default:
      return code;
  }
};

export default function LanguageSidebar({
  links,
  open,
  onClose,
  activeLangs,
  onToggleLang,
}: Props) {
  const [showThaiNames, setShowThaiNames] = React.useState(false);
  const [query, setQuery] = React.useState('');

  // Build language list from links
  const languages: LanguageInfo[] = React.useMemo(() => {
    const map = new Map<string, LanguageInfo>();
    for (const l of links) {
      const code = (l.language || '').trim();
      if (!code) continue;
      const key = code.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          code: key,
          nameEn: languageLabel(key),
          nameTh: languageLabel(key), // later swap to real Thai names
          count: 1,
        });
      } else {
        map.get(key)!.count += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  }, [links]);

  const filtered = languages.filter((lang) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      lang.nameEn.toLowerCase().includes(q) ||
      lang.nameTh.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  // Shared styles: desktop = static; mobile = overlay
  const basePanel = 'flex flex-col h-full w-64 bg-white border-r shadow-sm';

  return (
    <>
      {/* Backdrop for mobile */}
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />}

      <aside
        className={[
          basePanel,
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:translate-x-0 lg:z-0',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold text-sm not-italic">Languages</span>
          <div className="flex items-center gap-1">
            <button
              className={
                'px-1.5 py-0.5 rounded text-[10px] ' +
                (!showThaiNames ? 'bg-[#2D2A4A] text-white' : 'bg-gray-100')
              }
              onClick={() => setShowThaiNames(false)}
            >
              EN
            </button>
            <button
              className={
                'px-1.5 py-0.5 rounded text-[10px] ' +
                (showThaiNames ? 'bg-[#A51931] text-white' : 'bg-gray-100')
              }
              onClick={() => setShowThaiNames(true)}
            >
              ไทย
            </button>
            <button
              className="lg:hidden ml-1 text-gray-400 hover:text-gray-700"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-2 pb-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search language / ค้นหาภาษา…"
            className="w-full px-2 py-1.5 text-xs border rounded-full outline-none focus:ring-1 focus:ring-[#A51931]"
          />
        </div>

        {/* Language list */}
        <div className="flex-1 overflow-y-auto px-1 pb-3">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">No languages match.</div>
          )}

          <ul className="space-y-0.5">
            {filtered.map((lang) => {
              const label = showThaiNames ? lang.nameTh : lang.nameEn;
              const checked = activeLangs.includes(lang.code);
              return (
                <li
                  key={lang.code}
                  className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50"
                >
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleLang(lang.code)}
                      className="w-3 h-3"
                    />
                    <span className="truncate">
                      {label} <span className="text-[9px] text-gray-400">({lang.code})</span>
                    </span>
                  </label>
                  <span className="text-[9px] text-gray-400">{lang.count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}
