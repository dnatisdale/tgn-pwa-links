// src/components/LinksList.tsx
// Main “Browse” list + QR / Share / Sidebar language filter.

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { formatUrl } from '../utils/formatUrl';
import LanguageSidebar from './LanguageSidebar';

import {
  renderCardCanvas,
  downloadCardPng,
  shareCardIfPossible,
  type CardSize,
  type CardOrientation,
} from '../qrCard';

// src/components/LinksList.tsx — shared LinkDoc type
export type LinkDoc = {
  id: string;
  url: string;
  title?: string;
  tags?: string[];
  createdAt?: Timestamp | null;

  // Starter-kit / language metadata (all optional)
  titleEn?: string;
  titleTh?: string;
  langEn?: string;
  langTh?: string;
  iso3?: string;
  language?: string;
  program?: string | number;
  playUrl?: string;
  downloadZipUrl?: string;
  downloadTrackUrl?: string;
  shareTrackUrl?: string;

  // Allow any extra Firestore fields without type errors
  [key: string]: any;
};
// (end of shared LinkDoc type)

const fmt = (ts?: { seconds?: number } | null): string => {
  if (!ts || typeof ts.seconds !== 'number') return '';
  try {
    return new Date(ts.seconds * 1000).toLocaleString();
  } catch {
    return '';
  }
};

const displayUrl = (url: string) => url.replace(/^https?:\/\//, '');

// ---------- language helpers ----------

function computeLangKey(langEn?: string, langTh?: string, iso3?: string, language?: string) {
  const source = (langEn || langTh || iso3 || language || 'unknown')
    .toString()
    .trim()
    .toLowerCase();
  return (
    source
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9ก-๙]+/g, '-') // keep Thai
      .replace(/^-+|-+$/g, '') || 'unknown'
  );
}

function getUiLang(): 'th' | 'en' {
  try {
    const htmlLang = document.documentElement.lang?.toLowerCase();
    if (htmlLang === 'th') return 'th';

    const stored =
      localStorage.getItem('tgn_lang') ||
      localStorage.getItem('lang') ||
      localStorage.getItem('appLang');

    if ((stored || '').toLowerCase() === 'th') return 'th';
  } catch {
    // ignore
  }
  return 'en';
}

function sanitizeName(s: string) {
  return (s || '')
    .replace(/[\\/:"*?<>|]+/g, '-') // windows-safe
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

function yyyymmdd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// ======================================================
// Component
// ======================================================

export default function LinksList() {
  const { user } = useAuth();

  const [links, setLinks] = useState<LinkDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [textFilter, setTextFilter] = useState('');
  const [scope, setScope] = useState<'all' | 'title' | 'url' | 'tags'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // QR / card options
  const [orientation, setOrientation] = useState<CardOrientation>('portrait');
  const [includeQr, setIncludeQr] = useState(false);
  const [qrSize, setQrSize] = useState<CardSize>('md');

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLangs, setActiveLangs] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]); // card ids

  // card-level selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editTags, setEditTags] = useState('');

  // -------- Firestore subscription --------

  useEffect(() => {
    if (!user) {
      setLinks([]);
      setLoading(false);
      return;
    }

    const qy = query(collection(db, 'users', user.uid, 'links'), orderBy('createdAt', 'desc'));

    const off = onSnapshot(
      qy,
      (snap) => {
        const rows: LinkDoc[] = snap.docs.map((d) => {
          const data = d.data() as any;
          const langKey =
            data.langKey || computeLangKey(data.langEn, data.langTh, data.iso3, data.language);

          return {
            id: d.id,
            ...data,
            url: data.url ?? '',
            title: data.title ?? '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            createdAt: data.createdAt ?? null,
            langKey,
          };
        });

        setLinks(rows);
        setLoading(false);
      },
      (err) => {
        console.error('onSnapshot error:', err);
        setLinks([]);
        setLoading(false);
      }
    );

    return () => off();
  }, [user]);

  // -------- helpers for text filter --------

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const wildcardToRegex = (pattern: string) => {
    const safe = pattern.trim();
    if (!safe) return null;
    return new RegExp('^.*' + safe.split('*').map(escapeRegex).join('.*') + '.*$', 'i');
  };

  const rx = useMemo(() => wildcardToRegex(textFilter), [textFilter]);

  const toggleLang = (code: string) => {
    const key = code.toLowerCase();
    setActiveLangs((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  };

  const toggleProgram = (id: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // -------- filter links for view --------

  const filtered = useMemo(() => {
    let arr = links.slice();

    // program selection (from sidebar)
    if (selectedPrograms.length > 0) {
      const set = new Set(selectedPrograms);
      arr = arr.filter((l) => set.has(l.id));
    }

    // language selection (from sidebar)
    if (activeLangs.length > 0) {
      const want = new Set(activeLangs);
      arr = arr.filter((l: any) => {
        const key =
          l.langKey?.toLowerCase?.() ||
          l.language?.toLowerCase?.() ||
          l.iso3?.toLowerCase?.() ||
          l.langEn?.toLowerCase?.() ||
          l.langTh?.toLowerCase?.() ||
          '';
        return want.has(key);
      });
    }

    // text filter
    if (rx) {
      arr = arr.filter((l) => {
        const haystackPieces: string[] = [];
        if (scope === 'all' || scope === 'title') {
          haystackPieces.push(l.title ?? '', l.titleEn ?? '', l.titleTh ?? '');
        }
        if (scope === 'all' || scope === 'url') {
          haystackPieces.push(l.url ?? '');
        }
        if (scope === 'all' || scope === 'tags') {
          haystackPieces.push(...((l.tags ?? []) as string[]));
        }
        const haystack = haystackPieces.join(' ').toLowerCase();
        return rx.test(haystack);
      });
    }

    // tag filter (if used later)
    if (tagFilter) {
      arr = arr.filter((l) => (l.tags ?? []).includes(tagFilter));
    }

    return arr;
  }, [links, activeLangs, selectedPrograms, rx, scope, tagFilter]);

  // keep selection in sync with visible rows
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filtered.some((l) => l.id === id)));
  }, [filtered]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearSelection = () => setSelectedIds([]);
  const selectAllFiltered = () => setSelectedIds(filtered.map((l) => l.id));

  const selectedLinks = useMemo(
    () => filtered.filter((l) => selectedIds.includes(l.id)),
    [filtered, selectedIds]
  );

  const deleteSelected = async () => {
    if (!user || !selectedIds.length) return;

    const count = selectedIds.length;
    const ok = window.confirm(
      `Delete ${count} selected link${count > 1 ? 's' : ''}? This cannot be undone.`
    );
    if (!ok) return;

    try {
      await Promise.all(
        selectedIds.map((id) => deleteDoc(doc(db, 'users', user.uid, 'links', id)))
      );
      setSelectedIds([]);
    } catch (err) {
      console.error('Error deleting selected links:', err);
      alert('Failed to delete one or more links.');
    }
  };

  // inline edit helpers
  const startEdit = (l: LinkDoc) => {
    setEditingId(l.id);
    setEditTitle(l.title ?? '');
    setEditUrl(l.url ?? '');
    setEditTags((l.tags ?? []).join(', '));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditUrl('');
    setEditTags('');
  };

  const saveEdit = async (id: string) => {
    if (!user) return;

    const trimmedUrl = editUrl.trim();
    if (!trimmedUrl) {
      alert('URL is required.');
      return;
    }

    const tags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await updateDoc(doc(db, 'users', user.uid, 'links', id), {
        title: editTitle.trim(),
        url: trimmedUrl,
        tags,
      });
      cancelEdit();
    } catch (e) {
      console.error('Failed to update link', e);
      alert('Could not save changes.');
    }
  };

  // tag cloud (not changed)
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    links.forEach((l) => (l.tags ?? []).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [links]);

  const exportLinks = (rows: LinkDoc[]) => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tgn-links-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- share helpers ----------

  const composeCardText = (l: LinkDoc, uiLang: 'th' | 'en') => {
    const titleEn = l.titleEn || l.title || '';
    const titleTh = l.titleTh || '';
    const primaryTitle =
      uiLang === 'th' ? titleTh || titleEn || '(no title)' : titleEn || titleTh || '(no title)';
    const url = l.url || '';
    const tags = (l.tags ?? []).join(', ');
    const when = fmt(l.createdAt);

    const langLine =
      uiLang === 'th' ? `${l.langTh || l.langEn || ''}` : `${l.langEn || l.langTh || ''}`;

    const lines = [`Language: ${langLine}`.trim(), `Title: ${primaryTitle}`];
    if (titleEn && titleTh) lines.push(`Title(EN/TH): ${titleEn} / ${titleTh}`);
    lines.push(`URL: ${url}`);
    if (l.program || l.iso3) {
      lines.push(
        `Program/ISO3: ${l.program || ''}${l.program && l.iso3 ? ' • ' : ''}${(l.iso3 || '')
          .toString()
          .toUpperCase()}`
      );
    }
    lines.push(tags ? `Tags: ${tags}` : 'Tags: —');
    if (when) lines.push(`Saved: ${when}`);

    return lines.join('\n');
  };

  const shareLinkWithQrOrEmail = async (
    l: LinkDoc,
    primaryTitle: string,
    langLabel: string,
    fileBase: string
  ) => {
    const uiLang = getUiLang();
    const ok = window.confirm(
      uiLang === 'th'
        ? 'ต้องการแชร์พร้อมภาพ QR ใช่ไหม? (ถ้าอุปกรณ์ไม่รองรับจะแนะนำให้ดาวน์โหลดหรือส่งอีเมลแทน)'
        : 'Share with a QR image? (If your device can’t share files, you can download or email instead.)'
    );
    if (!ok) return;

    try {
      const canvas = await renderCardCanvas({
        title: primaryTitle,
        url: l.url,
        language: langLabel,
        size: qrSize,
        orientation,
      });

      const filename = `${sanitizeName(fileBase || primaryTitle || 'tgn-link')}.png`;
      const shared = await shareCardIfPossible(filename, canvas);
      if (shared) return;

      const wantDownload = window.confirm(
        uiLang === 'th'
          ? 'ไม่สามารถแชร์ไฟล์ได้ ต้องการดาวน์โหลด QR Card ไหม?'
          : 'Sharing not supported. Download the QR Card instead?'
      );
      if (wantDownload) {
        await downloadCardPng(filename, canvas);
        return;
      }

      const subject = primaryTitle || 'Shared link';
      const body = composeCardText(l, uiLang);
      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        body
      )}`;
      window.location.href = mailto;
    } catch (e) {
      console.error('Share failed', e);
      alert('Could not share.');
    }
  };

  // ---------- malformed URLs fixer ----------

  const fixable = useMemo(
    () =>
      links.filter((l) => {
        const next = formatUrl(l.url);
        return next !== null && next !== l.url;
      }),
    [links]
  );

  const fixAllMalformed = async () => {
    if (!user) return;
    const toFix = [...fixable];
    for (const l of toFix) {
      const next = formatUrl(l.url);
      if (!next || next === l.url) continue;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'links', l.id), { url: next });
      } catch (e) {
        console.error('Fix URL failed:', l.url, e);
      }
    }
    alert(`Fixed ${toFix.length} URL(s).`);
  };

  // ---------- early returns ----------

  if (!user) {
    return <p className="text-center text-gray-500">Sign in to view links.</p>;
  }

  if (loading) {
    return <p className="text-center text-gray-500">Loading links…</p>;
  }

  if (links.length === 0) {
    return <p className="text-center text-gray-500">No links yet.</p>;
  }

  const uiLang = getUiLang();

  // ======================================================
  // Layout
  // ======================================================

  return (
    <div className="flex max-w-6xl mx-auto">
      {/* Sidebar panel (left) */}
      <LanguageSidebar
        links={links}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeLangs={activeLangs}
        onToggleLang={toggleLang}
        selectedPrograms={selectedPrograms}
        setSelectedPrograms={setSelectedPrograms}
        onApply={() => {
          // nothing special to do; filtered useMemo reacts to state
        }}
      />

      {/* Right side (main content) */}
      <div className="flex-1 p-4 lg:ml-2">
        {/* Mobile sidebar toggle (hamburger) */}
        <div className="mb-2 flex justify-start">
          <button
            type="button"
            className="px-3 py-1.5 rounded-full border text-xs"
            onClick={() => setSidebarOpen(true)}
          >
            ☰ Languages / ภาษา
          </button>
        </div>

        {/* Filter + options box */}
        <div className="flex flex-col gap-2 border rounded-xl p-3 bg-gray-50">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as 'all' | 'title' | 'url' | 'tags')}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All (title + url + tags)</option>
              <option value="title">Title only</option>
              <option value="url">URL only</option>
              <option value="tags">Tags only</option>
            </select>

            <input
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              placeholder={
                scope === 'tags'
                  ? 'Search tags… (use * as wildcard)'
                  : 'Search title / url / tags (use * as wildcard)'
              }
              className="input-style flex-1 min-w-[220px]"
            />

            <label className="flex items-center gap-1 text-sm">
              Size:
              <select
                value={qrSize}
                onChange={(e) => setQrSize(e.target.value as CardSize)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </label>

            <label className="flex items-center gap-1 text-sm">
              Orientation:
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as CardOrientation)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>

            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={includeQr}
                onChange={(e) => setIncludeQr(e.target.checked)}
              />
              Include QR in share/QR Card
            </label>

            <button
              type="button"
              className="btn btn-blue"
              onClick={() => {
                setTextFilter('');
                setTagFilter(null);
                setActiveLangs([]);
                setSelectedPrograms([]);
              }}
            >
              Clear All
            </button>

            <button
              type="button"
              className="border rounded px-2 py-1 text-sm"
              onClick={() => exportLinks(filtered)}
            >
              Export visible
            </button>
          </div>

          {fixable.length > 0 && (
            <div className="p-2 border rounded bg-yellow-50 text-sm flex items-center justify-between">
              <span>
                Found <strong>{fixable.length}</strong> malformed URL(s).
              </span>
              <button
                type="button"
                className="border rounded px-2 py-1 ml-3"
                onClick={fixAllMalformed}
              >
                Fix malformed URLs
              </button>
            </div>
          )}
        </div>

        {/* Bulk actions bar */}
        {selectedIds.length > 0 && (
          <div className="mt-3 mb-2 px-3 py-2 border rounded-xl bg-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs">
            <div className="font-semibold text-gray-800">{selectedIds.length} selected</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-2 py-1 border rounded bg-white"
                onClick={() => {
                  const text = selectedLinks
                    .map((l) => composeCardText(l, uiLang))
                    .join('\n\n---\n\n');
                  navigator.clipboard
                    .writeText(text)
                    .then(() => alert('Selected links copied.'))
                    .catch(() => alert('Copy failed. Please try again.'));
                }}
              >
                Copy selected
              </button>

              <button
                type="button"
                className="px-2 py-1 border rounded bg-white"
                onClick={() => exportLinks(selectedLinks)}
              >
                Export selected
              </button>

              <button
                type="button"
                className="px-2 py-1 rounded bg-red-600 text-white border border-red-700"
                onClick={deleteSelected}
              >
                Delete selected
              </button>

              <button
                type="button"
                className="px-2 py-1 border rounded bg-white"
                onClick={clearSelection}
              >
                Clear selection
              </button>

              <button
                type="button"
                className="px-2 py-1 border rounded bg-white"
                onClick={selectAllFiltered}
              >
                Select all visible
              </button>
            </div>
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
          {filtered.map((l) => {
            const isEditing = editingId === l.id;

            const titleEn = l.titleEn || l.title || '';
            const titleTh = l.titleTh || '';
            const langEn = l.langEn || '';
            const langTh = l.langTh || '';
            const iso3 = (l.iso3 || l.language || '').toString().toUpperCase();
            const program = l.program ?? '';
            const programStr = typeof program === 'number' ? String(program) : program || '';

            const uiLangCard = uiLang;
            const primaryTitle =
              uiLangCard === 'th'
                ? titleTh || titleEn || '(no title)'
                : titleEn || titleTh || '(no title)';

            const langLabel =
              uiLangCard === 'th' ? langTh || langEn || iso3 || '' : langEn || langTh || iso3 || '';

            const playUrl = l.playUrl || l.downloadTrackUrl || l.url;

            const fileBase = `${sanitizeName(langLabel || 'Lang')}-${sanitizeName(
              programStr || 'NA'
            )}-${yyyymmdd()}`;

            return (
              <div
                key={l.id}
                className="border rounded p-3 bg-white shadow-sm h-full flex flex-col"
              >
                {/* Header: languages + program titles */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {/* Line 1: Language EN / Language TH */}
                    {!isEditing && (
                      <div className="font-semibold text-sm truncate">
                        {langEn || iso3}
                        {langTh ? <span className="text-gray-600"> / {langTh}</span> : null}
                      </div>
                    )}

                    {/* Line 2: Program titles EN • TH • program • iso3 */}
                    {!isEditing && (
                      <div className="text-xs text-gray-700 truncate">
                        {titleEn || titleTh ? (
                          <>
                            {titleEn}
                            {titleTh ? <span> • {titleTh}</span> : null}
                            {programStr || iso3 ? (
                              <>
                                {programStr ? <span> • {programStr}</span> : null}
                                {iso3 ? <span> • {iso3}</span> : null}
                              </>
                            ) : null}
                          </>
                        ) : (
                          <>
                            {programStr || iso3 ? (
                              <>
                                {programStr ? <span>{programStr}</span> : null}
                                {iso3 ? <span> • {iso3}</span> : null}
                              </>
                            ) : (
                              <span className="italic text-gray-400">(no title)</span>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Editing title (single field) */}
                    {isEditing && (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="border rounded px-2 py-1 text-xs w-full"
                        placeholder="Title"
                      />
                    )}
                  </div>

                  {/* Checkbox on right */}
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 w-3.5 h-3.5"
                      checked={selectedIds.includes(l.id)}
                      onChange={() => toggleSelect(l.id)}
                    />
                  </div>
                </div>

                {/* URL under titles */}
                {isEditing ? (
                  <input
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="border rounded px-2 py-1 text-xs w-full mt-1 break-all"
                    placeholder="https://example.com"
                  />
                ) : (
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline break-all inline-block mt-1"
                  >
                    {displayUrl(l.url)}
                  </a>
                )}

                {/* Tags while editing */}
                {isEditing && (
                  <input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="border rounded px-2 py-1 text-xs w-full mt-1"
                    placeholder="Tags (comma separated)"
                  />
                )}

                {/* Audio player */}
                {!isEditing && playUrl && <audio controls src={playUrl} className="w-full mt-2" />}

                {/* Actions row */}
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className="px-2 py-1 rounded bg-[#2D2A4A] text-white"
                        onClick={() => saveEdit(l.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 border rounded bg-white"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Share (QR + mailto fallback) */}
                      <button
                        type="button"
                        className="border rounded px-2 py-1"
                        onClick={() => shareLinkWithQrOrEmail(l, primaryTitle, langLabel, fileBase)}
                      >
                        ↗︎ Share
                      </button>

                      {/* QR Card (PNG) */}
                      <button
                        type="button"
                        className="border rounded px-2 py-1"
                        onClick={async () => {
                          const ok = window.confirm(
                            uiLang === 'th'
                              ? 'ต้องการสร้าง/ดาวน์โหลด QR Card ใช่ไหม?'
                              : 'Create/download a QR Card now?'
                          );
                          if (!ok) return;

                          const canvas = await renderCardCanvas({
                            title: primaryTitle,
                            url: l.url,
                            language: langLabel,
                            size: qrSize,
                            orientation,
                          });
                          const filename = `${sanitizeName(fileBase)}.png`;
                          const shared = await shareCardIfPossible(filename, canvas);
                          if (!shared) {
                            await downloadCardPng(filename, canvas);
                          }
                        }}
                      >
                        ◻︎ QR Card
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        className="border rounded px-2 py-1"
                        onClick={() => startEdit(l)}
                      >
                        🖉 Edit
                      </button>
                    </>
                  )}
                </div>

                {/* Timestamp bottom-right */}
                <div className="mt-1 flex justify-end">
                  <span className="text-[10px] text-gray-400">{fmt(l.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// end of src/components/LinksList.tsx
