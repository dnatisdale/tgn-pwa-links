// src/components/LanguageSidebar.tsx
// Language filter + program picker sidebar

import React, { useMemo, useState } from 'react';
import type { LinkDoc } from './LinksList';
import { useI18n } from '../i18n-provider';

type LangGroup = {
  key: string;
  labelEn: string;
  labelTh: string;
  iso3: string;
  total: number;
  programs: {
    id: string;
    title: string;
    checked: boolean;
  }[];
};

type Props = {
  links: LinkDoc[];
  open: boolean;
  onClose: () => void;

  // Which languages are currently “on” in the Browse view
  activeLangs: string[];
  onToggleLang: (langKey: string, checked: boolean) => void;

  // Which individual program/message IDs are selected
  selectedPrograms: string[];
  onToggleProgram: (linkId: string, checked: boolean) => void;
};

function normalizeKey(value: unknown): string {
  if (!value) return '';
  return String(value).toLowerCase().trim();
}

export default function LanguageSidebar({
  links,
  open,
  onClose,
  activeLangs,
  onToggleLang,
  selectedPrograms,
  onToggleProgram,
}: Props) {
  const { t } = useI18n();
  const [fontSize, setFontSize] = useState(22); // Sidebar font size control

  // Build language groups from the link list
  const groups = useMemo<LangGroup[]>(() => {
    const map = new Map<string, LangGroup>();

    for (const l of links) {
      const anyL = l as any;

      // Decide the language “key” used for filtering
      const langKeyRaw =
        normalizeKey(anyL.langKey) || normalizeKey(anyL.iso3) || normalizeKey(anyL.language);

      if (!langKeyRaw) continue;

      // Human-readable language names (bilingual)
      const labelEn = (anyL.langEn as string) || (anyL.language as string) || 'Unknown Language';
      const labelTh = (anyL.langTh as string) || '';

      // Titles (program/message names)
      const titleEn = (anyL.titleEn as string) || (l.title as string | undefined) || '';
      const titleTh = (anyL.titleTh as string) || '';

      const programCode =
        anyL.program !== undefined && anyL.program !== null ? String(anyL.program) : '';

      const combinedTitleParts = [
        titleEn,
        titleTh,
        programCode,
        (anyL.iso3 as string) || '',
      ].filter(Boolean);

      const combinedTitle = combinedTitleParts.join(' • ') || '(no title)';

      const iso3 = (anyL.iso3 as string) || '';

      let group = map.get(langKeyRaw);
      if (!group) {
        group = {
          key: langKeyRaw,
          labelEn,
          labelTh,
          iso3,
          total: 0,
          programs: [],
        };
        map.set(langKeyRaw, group);
      }

      group.total += 1;
      group.programs.push({
        id: l.id,
        title: combinedTitle,
        checked: selectedPrograms.includes(l.id),
      });
    }

    // Sort by English label for now
    return Array.from(map.values()).sort((a, b) => a.labelEn.localeCompare(b.labelEn));
  }, [links, selectedPrograms]);

  if (!open) return null;

  const fontSizeStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
  };

  return (
    <>
      {/* Dark backdrop */}
      <div className="fixed inset-0 bg-black/40 z-30" onClick={onClose} />

      {/* Sidebar panel */}
      <aside className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl z-40 flex flex-col">
        {/* Header: title + font-size controls + Close */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex flex-col">
            <span className="font-bold text-lg" style={fontSizeStyle}>
              {t('languagesLabel') ?? 'Languages'}
            </span>
            {/* You can localize this label later if you like */}
            <span className="text-xs text-gray-500">
              Select languages & messages to filter / share / export
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="border rounded px-2 py-1 text-xs"
              onClick={() => setFontSize((s) => Math.max(12, s - 2))}
            >
              −
            </button>
            <span className="text-xs" style={{ minWidth: 40, textAlign: 'center' }}>
              {fontSize}px
            </span>
            <button
              type="button"
              className="border rounded px-2 py-1 text-xs"
              onClick={() => setFontSize((s) => Math.min(32, s + 2))}
            >
              +
            </button>
            <button
              type="button"
              className="ml-2 text-xs border rounded px-2 py-1"
              onClick={onClose}
            >
              {t('close') ?? 'Close'}
            </button>
          </div>
        </div>

        {/* Language + program list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {groups.map((g) => {
            const langChecked = activeLangs.includes(g.key);
            const langLabelParts = [g.labelEn, g.labelTh].filter(Boolean);
            const langLabel = langLabelParts.join(' / ');

            return (
              <section
                key={g.key}
                className="border rounded-xl px-3 py-2 bg-gray-50"
                style={fontSizeStyle}
              >
                {/* Language row */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={langChecked}
                      onChange={(e) => onToggleLang(g.key, e.target.checked)}
                    />
                    <span className="font-semibold">{langLabel || 'Unknown Language'}</span>
                  </label>

                  <div className="flex flex-col items-end text-xs">
                    {g.iso3 && <span>{g.iso3}</span>}
                    <span>{g.total}</span>
                  </div>
                </div>

                {/* Program titles */}
                <div className="pl-6 space-y-1">
                  {g.programs.map((p) => (
                    <label key={p.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={p.checked}
                        onChange={(e) => onToggleProgram(p.id, e.target.checked)}
                      />
                      <span>{p.title}</span>
                    </label>
                  ))}
                </div>
              </section>
            );
          })}

          {groups.length === 0 && (
            <p className="text-sm text-gray-500" style={fontSizeStyle}>
              {t('noLanguages') ?? 'No languages found.'}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}

// end of src/components/LanguageSidebar.tsx
