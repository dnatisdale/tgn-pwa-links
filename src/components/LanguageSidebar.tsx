import React, { useEffect, useMemo, useState } from 'react';

type LinkDoc = {
  id: string;
  title?: string;
  titleEn?: string;
  titleTh?: string;
  langEn?: string;
  langTh?: string;
  iso3?: string;
  language?: string;
  program?: string;
  [key: string]: any;
};

type Props = {
  links: LinkDoc[];
  open: boolean;
  onClose: () => void;
  activeLangs: string[]; // lowercased keys
  onToggleLang: (code: string) => void; // receives lowercased key
};

function getUiLang(): 'th' | 'en' {
  try {
    const htmlLang = document.documentElement.lang?.toLowerCase();
    if (htmlLang === 'th') return 'th';
    const stored =
      localStorage.getItem('tgn_lang') ||
      localStorage.getItem('lang') ||
      localStorage.getItem('appLang');
    if ((stored || '').toLowerCase() === 'th') return 'th';
  } catch {}
  return 'en';
}

// Windows-safe filename-ish sanitizer; here we repurpose for neat language keys if needed.
function normalizeKey(s: string) {
  return (s || '').toLowerCase().trim();
}

type LangGroup = {
  key: string; // lowercased key used for filtering
  labelEn: string;
  labelTh: string;
  iso3: string;
  titles: string[]; // deduped, UI-language preferred titles
  total: number; // count of items for that language
};

const MAX_TITLES_COLLAPSED = 6;

export default function LanguageSidebar({
  links,
  open,
  onClose,
  activeLangs,
  onToggleLang,
}: Props) {
  const uiLang = getUiLang();

  // Sidebar font size (affects only sidebar)
  const [fontPx, setFontPx] = useState<number>(() => {
    const saved = Number(localStorage.getItem('sidebarFontPx') || '0');
    return saved && !Number.isNaN(saved) ? saved : 14;
  });

  useEffect(() => {
    localStorage.setItem('sidebarFontPx', String(fontPx));
  }, [fontPx]);

  // Expanded state per language (to show all titles)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const groups: LangGroup[] = useMemo(() => {
    // Group by a robust language key; use explicit language field first, else iso3, else langEn/langTh
    const map = new Map<string, LangGroup>();

    for (const l of links) {
      const key =
        normalizeKey(l.language) ||
        normalizeKey(l.iso3) ||
        normalizeKey(l.langEn) ||
        normalizeKey(l.langTh) ||
        '';

      if (!key) continue;

      const iso3 = (l.iso3 || '').toString().toUpperCase();
      const labelEn = (l.langEn || iso3 || l.language || '').toString().trim();
      const labelTh = (l.langTh || labelEn || '').toString().trim();

      // Choose a title to list under this language (prefer UI language)
      const tEn = (l.titleEn || l.title || '').toString().trim();
      const tTh = (l.titleTh || '').toString().trim();
      const chosenTitle = uiLang === 'th' ? tTh || tEn : tEn || tTh;

      const g = map.get(key) || {
        key,
        labelEn,
        labelTh,
        iso3,
        titles: [],
        total: 0,
      };

      // Add unique title (avoid blanks)
      if (chosenTitle) {
        if (!g.titles.includes(chosenTitle)) {
          g.titles.push(chosenTitle);
        }
      }
      g.total += 1;

      map.set(key, g);
    }

    // Sort by label (in displayed language)
    const arr = [...map.values()];
    arr.sort((a, b) => {
      const la = uiLang === 'th' ? a.labelTh || a.labelEn : a.labelEn || a.labelTh;
      const lb = uiLang === 'th' ? b.labelTh || b.labelEn : b.labelEn || b.labelTh;
      return la.localeCompare(lb, uiLang === 'th' ? 'th' : 'en', { sensitivity: 'base' });
    });

    return arr;
  }, [links, uiLang]);

  const sidebarBody = (
    <div
      className="h-full overflow-y-auto p-3"
      style={{ fontSize: `${fontPx}px`, lineHeight: 1.35 as any }}
    >
      {/* Header / Controls */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-semibold">{uiLang === 'th' ? 'ภาษา' : 'Languages'}</div>

        <div className="flex items-center gap-2">
          {/* Font size control */}
          <div className="flex items-center gap-1 border rounded px-2 py-0.5 bg-white">
            <button
              type="button"
              className="px-2"
              onClick={() => setFontPx((p) => Math.max(10, p - 1))}
              title={uiLang === 'th' ? 'เล็กลง' : 'Smaller'}
            >
              −
            </button>
            <span className="text-xs tabular-nums">{fontPx}px</span>
            <button
              type="button"
              className="px-2"
              onClick={() => setFontPx((p) => Math.min(24, p + 1))}
              title={uiLang === 'th' ? 'ใหญ่ขึ้น' : 'Larger'}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="border rounded px-2 py-0.5 bg-white text-xs"
            onClick={onClose}
          >
            {uiLang === 'th' ? 'ปิด' : 'Close'}
          </button>
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {groups.map((g) => {
          const shownLangLabel =
            uiLang === 'th' ? g.labelTh || g.labelEn || g.iso3 : g.labelEn || g.labelTh || g.iso3;

          const isActive = activeLangs.includes(g.key);
          const isExpanded = !!expanded[g.key];

          const titles = g.titles
            .slice()
            .sort((a, b) =>
              a.localeCompare(b, uiLang === 'th' ? 'th' : 'en', { sensitivity: 'base' })
            );

          const visible = isExpanded ? titles : titles.slice(0, MAX_TITLES_COLLAPSED);
          const moreCount = Math.max(0, titles.length - visible.length);

          return (
            <div key={g.key} className="border rounded-lg p-2 bg-gray-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={isActive}
                  onChange={() => onToggleLang(g.key)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {shownLangLabel || (uiLang === 'th' ? 'ไม่ทราบภาษา' : 'Unknown Language')}
                  </div>
                  {/* show iso3 small if present */}
                  {g.iso3 && <div className="text-gray-500 text-[0.85em] mt-0.5">{g.iso3}</div>}
                </div>
                <div className="text-gray-500 text-[0.85em] ml-2">{g.total}</div>
              </label>

              {/* Titles under language */}
              {visible.length > 0 && (
                <ul className="mt-1 pl-6 list-disc space-y-1">
                  {visible.map((t) => (
                    <li key={t} className="truncate">
                      {t}
                    </li>
                  ))}
                </ul>
              )}

              {moreCount > 0 && (
                <button
                  type="button"
                  className="mt-1 ml-6 text-[0.9em] underline"
                  onClick={() => setExpanded((prev) => ({ ...prev, [g.key]: !prev[g.key] }))}
                >
                  {isExpanded
                    ? uiLang === 'th'
                      ? 'แสดงน้อยลง'
                      : 'Show less'
                    : uiLang === 'th'
                    ? `แสดงอีก ${moreCount} รายการ`
                    : `Show ${moreCount} more`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Layout: drawer on small screens, sticky panel on large screens
  return (
    <>
      {/* Mobile / overlay drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${open ? 'block' : 'hidden'}`}
        role="dialog"
        aria-modal="true"
      >
        {/* backdrop */}
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        {/* panel */}
        <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[360px] bg-white shadow-xl">
          {sidebarBody}
        </div>
      </div>

      {/* Desktop sticky panel */}
      <aside className="hidden lg:block w-[320px] shrink-0 sticky top-2 h-[calc(100vh-16px)] border rounded-xl bg-white">
        {sidebarBody}
      </aside>
    </>
  );
}
