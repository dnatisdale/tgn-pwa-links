// src/components/LinksList.tsx

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
// --- UI language + helpers ---
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

function sanitizeName(s: string) {
  return (s || '')
    .replace(/[\\/:"*?<>|]+/g, '-') // windows-safe
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

function yyyymmdd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

type LinkDoc = {
  id: string;
  url: string;
  title?: string;
  tags?: string[];
  language?: string;
  createdAt?: Timestamp | null;
  // keep all extra starter-kit fields (iso3, titleEn, titleTh, etc.)
  [key: string]: any;
};

const fmt = (ts?: { seconds?: number } | null): string => {
  if (!ts || typeof ts.seconds !== 'number') return '';
  try {
    return new Date(ts.seconds * 1000).toLocaleString();
  } catch {
    return '';
  }
};

const displayUrl = (url: string) => url.replace(/^https?:\/\//, '');

export default function LinksList() {
  const { user } = useAuth();

  const [links, setLinks] = useState<LinkDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [textFilter, setTextFilter] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [scope, setScope] = useState<'all' | 'title' | 'url' | 'tags'>('all');

  // QR / card options
  const [orientation, setOrientation] = useState<CardOrientation>('portrait');
  const [includeQr, setIncludeQr] = useState(false);
  const [qrSize, setQrSize] = useState<CardSize>('md');

  // Sidebar & language filter
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLangs, setActiveLangs] = useState<string[]>([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editTags, setEditTags] = useState('');

  // =========================
  // Firestore subscription
  // =========================
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
          return {
            id: d.id,
            ...data,
            url: data.url ?? '',
            title: data.title ?? '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            language:
              (data.language || data.lang || data.iso3 || '').toString().trim() || undefined,
            createdAt: data.createdAt ?? null,
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

  // =========================
  // Helpers
  // =========================

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

  // =========================
  // Filtered links
  // =========================
  const filtered = useMemo(() => {
    let rows = links;

    if (activeLangs.length > 0) {
      rows = rows.filter((l) => {
        const lang = (l.language || '').toLowerCase();
        return lang && activeLangs.includes(lang);
      });
    }

    if (tagFilter) {
      rows = rows.filter((l) => (l.tags ?? []).includes(tagFilter));
    }

    if (rx) {
      rows = rows.filter((l) => {
        const title = l.title ?? '';
        const url = l.url ?? '';
        const tagsText = (l.tags ?? []).join(' ');
        const haystack =
          scope === 'title'
            ? title
            : scope === 'url'
            ? url
            : scope === 'tags'
            ? tagsText
            : `${title} ${url} ${tagsText}`;
        return rx.test(haystack);
      });
    }

    return rows;
  }, [links, activeLangs, tagFilter, rx, scope]);

  // Keep selection in sync with visible rows
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filtered.some((l) => l.id === id)));
  }, [filtered]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearSelection = () => setSelectedIds([]);

  const selectAllFiltered = () => {
    setSelectedIds(filtered.map((l) => l.id));
  };

  const selectedLinks = useMemo(
    () => filtered.filter((l) => selectedIds.includes(l.id)),
    [filtered, selectedIds]
  );

  const deleteSelected = async () => {
    if (!user) return;
    if (!selectedIds.length) return;

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

  // Inline edit helpers
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

  // Tag cloud
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    links.forEach((l) => (l.tags ?? []).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [links]);

  // Export helpers
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

  // Compose text for share/mailto/bulk copy
  const composeCardText = (l: LinkDoc) => {
    const primaryTitle = l.titleEn || l.title || '(no title)';
    const secondaryTitle = l.titleTh || '';
    const url = l.url || '';
    const tags = (l.tags ?? []).join(', ');
    const when = fmt(l.createdAt);

    const lines = [`Title: ${primaryTitle}`];
    if (secondaryTitle) {
      lines.push(`Title (TH): ${secondaryTitle}`);
    }
    lines.push(`URL: ${url}`);
    lines.push(tags ? `Tags: ${tags}` : 'Tags: —');
    if (when) {
      lines.push(`Saved: ${when}`);
    }

    return lines.join('\n');
  };

  // Share helper: QR + Web Share if possible, else mailto
  const shareLinkWithQrOrEmail = async (
    l: LinkDoc,
    primaryTitle: string,
    langLabel: string,
    fileBase: string
  ) => {
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
      if (shared) {
        return;
      }

      // Fallback: simple mailto with text (cannot attach image via mailto)
      const subject = primaryTitle || 'Shared link';
      const body = composeCardText(l);
      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        body
      )}`;
      window.location.href = mailto;
    } catch (e) {
      console.error('Share failed', e);
      alert('Could not share. You can copy the URL instead.');
    }
  };

  // Malformed URL fixer
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

  // =========================
  // Render states
  // =========================

  if (!user) {
    return <p className="text-center text-gray-500">Sign in to view links.</p>;
  }

  if (loading) {
    return <p className="text-center text-gray-500">Loading links…</p>;
  }

  if (links.length === 0) {
    return <p className="text-center text-gray-500">No links yet.</p>;
  }

  // =========================
  // Main layout
  // =========================

  return (
    <div className="flex max-w-6xl mx-auto">
      {/* Sidebar */}
      <LanguageSidebar
        links={links}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeLangs={activeLangs}
        onToggleLang={toggleLang}
      />

      {/* Right side */}
      <div className="flex-1 p-4 lg:ml-2">
        {/* Mobile sidebar toggle */}
        <div className="mb-2 lg:hidden flex justify-start">
          <button
            type="button"
            className="px-3 py-1.5 rounded-full border text-xs"
            onClick={() => setSidebarOpen(true)}
          >
            ☰ Languages / ภาษา
          </button>
        </div>

        {/* Choices box */}
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
              Include QR in share/PNG
            </label>

            <button
              type="button"
              className="btn btn-blue"
              onClick={() => {
                setTextFilter('');
                setTagFilter(null);
                setActiveLangs([]);
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

          <p className="text-xs text-gray-500">
            Searching your <strong>saved links</strong> (newest first). Scope:{' '}
            <strong>{scope}</strong>.{' '}
            {activeLangs.length > 0 && (
              <>
                Languages: <strong>{activeLangs.join(', ')}</strong>.
              </>
            )}
          </p>

          {tagCounts.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className={`px-2 py-0.5 text-xs rounded-full border ${
                  !tagFilter ? 'bg-gray-100' : ''
                }`}
                onClick={() => setTagFilter(null)}
              >
                All tags
              </button>
              {tagCounts.map(([t, n]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTagFilter((cur) => (cur === t ? null : t))}
                  className={`px-2 py-0.5 text-xs rounded-full border ${
                    tagFilter === t ? 'bg-gray-100' : ''
                  }`}
                  title={`${n} item(s)`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

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
                  const text = selectedLinks.map((l) => composeCardText(l)).join('\n\n---\n\n');
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

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
          {filtered.map((l) => {
            const isEditing = editingId === l.id;

            const titleEn = l.titleEn || l.title || '';
            const titleTh = l.titleTh || '';
            const iso3 = (l.iso3 || l.language || '').toUpperCase();
            const langEn = l.langEn || '';
            const langTh = l.langTh || '';
            const program = l.program || '';

            const uiLang = getUiLang();
            const primaryTitle =
              uiLang === 'th'
                ? titleTh || titleEn || '(no title)'
                : titleEn || titleTh || '(no title)';

            const langLabel =
              uiLang === 'th' ? langTh || langEn || iso3 || '' : langEn || langTh || iso3 || '';

            const playUrl = l.playUrl || l.downloadTrackUrl || l.url;

            return (
              <div
                key={l.id}
                className="border rounded p-3 bg-white shadow-sm h-full flex flex-col"
              >
                {/* Header: titles + checkbox */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {isEditing ? (
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="border rounded px-2 py-1 text-xs w-full"
                        placeholder="Title"
                      />
                    ) : (
                      <>
                        <div className="font-semibold text-sm truncate">{primaryTitle}</div>
                        {titleEn && titleTh && <div className="text-sm truncate">{titleTh}</div>}
                        {(iso3 || langEn || langTh || program) && (
                          <div className="text-[10px] text-gray-500 truncate">
                            {iso3 && <span className="font-semibold mr-1">{iso3}</span>}
                            {langEn && <span>{langEn}</span>}
                            {langTh && <span className="ml-1">/ {langTh}</span>}
                            {program && <span className="ml-1">• {program}</span>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 w-3.5 h-3.5"
                      checked={selectedIds.includes(l.id)}
                      onChange={() => toggleSelect(l.id)}
                    />
                  </div>
                </div>

                {/* URL */}
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

                {/* Actions */}
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
                      <button
                        type="button"
                        className="border rounded px-2 py-1"
                        onClick={() => startEdit(l)}
                      >
                        ✏ Edit
                      </button>

                      <button
                        type="button"
                        className="border rounded px-2 py-1"
                        onClick={() => {
                          const fileBase = `${sanitizeName(langLabel || 'Lang')}-${sanitizeName(
                            program || 'NA'
                          )}-${yyyymmdd()}`;
                          shareLinkWithQrOrEmail(l, primaryTitle, langLabel, fileBase);
                        }}
                      >
                        Share
                      </button>

                      <button
                        type="button"
                        className="border rounded px-2 py-1"
                        onClick={async () => {
                          const canvas = await renderCardCanvas({
                            title: primaryTitle,
                            url: l.url,
                            language: langLabel,
                            size: qrSize,
                            orientation,
                          });
                          const fileBase = `${sanitizeName(langLabel || 'Lang')}-${sanitizeName(
                            program || 'NA'
                          )}-${yyyymmdd()}`;
                          const filename = `${fileBase}.png`;
                          const shared = await shareCardIfPossible(filename, canvas);
                          if (!shared) {
                            await downloadCardPng(filename, canvas);
                          }
                        }}
                      >
                        PNG
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
