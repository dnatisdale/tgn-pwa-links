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
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { formatUrl } from '../utils/formatUrl';
import QRCode from 'qrcode';

type LinkDoc = {
  id: string;
  url: string;
  title?: string;
  tags?: string[];
  createdAt?: Timestamp | null;
};

export default function LinksList() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection + filters
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [textFilter, setTextFilter] = useState(''); // supports '*'
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [scope, setScope] = useState<'all' | 'title' | 'url' | 'tags'>('all');

  // ------------ Firestore live subscription ------------
  useEffect(() => {
    if (!user) {
      setLinks([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'links'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: LinkDoc[] = snap.docs.map((d) => {
          const data = d.data() as Omit<LinkDoc, 'id'>;
          return {
            id: d.id,
            url: (data as any).url ?? '',
            title: (data as any).title ?? '',
            tags: Array.isArray((data as any).tags) ? (data as any).tags : [],
            createdAt: (data as any).createdAt ?? null,
          };
        });
        setLinks(rows);
        setLoading(false);
        setSelectedIds(new Set()); // clear selection when data changes
      },
      (err) => {
        console.error('onSnapshot error:', err);
        setLinks([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // ------------ Helpers ------------
  const fmt = (ts?: Timestamp | null) => (ts ? new Date(ts.seconds * 1000).toLocaleString() : '');

  // Simple, reliable favicon source
  const faviconFor = (rawUrl: string) => {
    try {
      const host = new URL(rawUrl).hostname;
      return `https://icons.duckduckgo.com/ip3/${host}.ico`;
    } catch {
      return '';
    }
  };

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wildcardToRegex = (pattern: string) => {
    const safe = pattern.trim();
    if (!safe) return null;
    return new RegExp('^.*' + safe.split('*').map(escapeRegex).join('.*') + '.*$', 'i');
  };
  const rx = useMemo(() => wildcardToRegex(textFilter), [textFilter]);

  const filtered = useMemo(() => {
    return links.filter((l) => {
      if (tagFilter && !(l.tags ?? []).includes(tagFilter)) return false;
      if (!rx) return true; // nothing typed → pass

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
  }, [links, tagFilter, rx, scope]);

  // Tag cloud (top 12)
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    links.forEach((l) => (l.tags ?? []).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [links]);

  const total = filtered.length;
  const selectedCount = [...selectedIds].filter((id) => filtered.some((f) => f.id === id)).length;
  const allVisibleSelected = selectedCount === total && total > 0;

  // Selection helpers
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAllVisible = () => {
    const next = new Set(selectedIds);
    filtered.forEach((l) => next.add(l.id));
    setSelectedIds(next);
  };
  const clearVisible = () => {
    const next = new Set(selectedIds);
    filtered.forEach((l) => next.delete(l.id));
    setSelectedIds(next);
  };

  // Bulk copy/delete
  const copySelected = async () => {
    try {
      const urls = links
        .filter((l) => selectedIds.has(l.id))
        .map((l) => l.url)
        .join('\n');
      if (!urls) return;
      await navigator.clipboard.writeText(urls);
      alert('Copied selected URLs to clipboard.');
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const deleteSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected item(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(
        [...selectedIds].map((id) => deleteDoc(doc(db, 'users', user.uid, 'links', id)))
      );
      setSelectedIds(new Set());
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Some deletes failed. See console.');
    }
  };

  // Share / copy (per item)
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied!');
    } catch {}
  };

  const shareLink = async (url: string, title?: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: title || 'Link', url });
      } else {
        await copyToClipboard(url);
      }
    } catch {}
  };

  // Export (JSON of current filtered list)
  const exportLinks = (rows: LinkDoc[]) => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tgn-links-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // QR code (per item)
  const openQrFor = async (url: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 1 });
      const w = window.open('', '_blank', 'width=320,height=340');
      if (w) {
        w.document.write(`<img src="${dataUrl}" alt="QR" style="display:block;margin:12px auto"/>`);
      }
    } catch (e) {
      console.error('QR failed:', e);
    }
  };

  // ------------ Find & fix malformed URLs in Firestore ------------
  const fixable = useMemo(() => {
    return links.filter((l) => {
      const next = formatUrl(l.url);
      return next !== null && next !== l.url;
    });
  }, [links]);

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

  // ------------ Render ------------
  if (!user) return <p className="text-center text-gray-500">Sign in to view links.</p>;
  if (loading) return <p className="text-center text-gray-500">Loading links…</p>;
  if (links.length === 0) return <p className="text-center text-gray-500">No links yet.</p>;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      {/* Controls: scope + search + clear */}
      <div className="flex flex-col gap-2 border rounded p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as 'all' | 'title' | 'url' | 'tags')}
            className="border rounded px-2 py-1 text-sm"
            title="Where to search"
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

          <button
            type="button"
            className="btn btn-blue font-krub"
            onClick={() => {
              setTextFilter('');
              setTagFilter(null);
              setSelectedIds(new Set());
            }}
            title="Clear search, tag filter, and selection"
          >
            Clear All
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Searching your <strong>saved links</strong> (newest first). Scope:{' '}
          <strong>{scope}</strong>.
        </p>

        {tagCounts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className={`px-2 py-0.5 text-xs rounded-full border ${
                !tagFilter ? 'bg-gray-100' : ''
              }`}
              onClick={() => setTagFilter(null)}
              title="Show all tags"
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

        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span>
            Showing <strong>{total}</strong> item(s)
            {selectedCount > 0 && (
              <>
                {' '}
                — Selected <strong>{selectedCount}</strong>
              </>
            )}
          </span>

          <button
            type="button"
            className="border rounded px-2 py-1"
            onClick={allVisibleSelected ? clearVisible : selectAllVisible}
          >
            {allVisibleSelected ? 'Clear all (visible)' : 'Select all (visible)'}
          </button>

          <button type="button" className="border rounded px-2 py-1" onClick={clearVisible}>
            Clear selection (visible)
          </button>

          <button
            type="button"
            className="border rounded px-2 py-1"
            onClick={copySelected}
            disabled={selectedIds.size === 0}
            title="Copy selected URLs"
          >
            Copy selected
          </button>

          <button
            type="button"
            className="border rounded px-2 py-1"
            onClick={deleteSelected}
            disabled={selectedIds.size === 0}
            title="Delete selected"
          >
            Delete selected
          </button>

          <button
            type="button"
            className="border rounded px-2 py-1"
            onClick={() => exportLinks(filtered)}
            title="Export currently shown list as JSON"
          >
            Export (JSON)
          </button>
        </div>

        {/* Fix malformed URLs notice */}
        {fixable.length > 0 && (
          <div className="p-2 border rounded bg-yellow-50 text-sm flex items-center justify-between">
            <span>
              Found <strong>{fixable.length}</strong> malformed URL(s) (e.g.,
              “https://Https://...”).
            </span>
            <button
              type="button"
              className="border rounded px-2 py-1 ml-3"
              onClick={fixAllMalformed}
              title="Normalize and save URLs"
            >
              Fix malformed URLs
            </button>
          </div>
        )}
      </div>

      {/* Cards */}
      {filtered.map((l) => (
        <div key={l.id} className="border rounded p-3">
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 min-w-0">
              <input
                type="checkbox"
                checked={selectedIds.has(l.id)}
                onChange={() => toggleOne(l.id)}
              />
              <div className="flex items-center gap-2 min-w-0">
                {l.url && (
                  <img
                    src={faviconFor(l.url)}
                    alt=""
                    className="w-4 h-4 rounded-sm shrink-0"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                    }}
                  />
                )}
                <div className="font-semibold truncate">{l.title || '(no title)'}</div>
              </div>
            </label>
            <div className="text-xs opacity-60 whitespace-nowrap">{fmt(l.createdAt)}</div>
          </div>

          <a
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="underline break-all inline-block mt-1"
          >
            {l.url}
          </a>

          <div className="mt-2 flex gap-2 text-sm">
            <button
              type="button"
              className="border rounded px-2 py-1"
              onClick={() => shareLink(l.url, l.title)}
            >
              Share
            </button>
            <button
              type="button"
              className="border rounded px-2 py-1"
              onClick={() => copyToClipboard(l.url)}
            >
              Copy
            </button>
            <button
              type="button"
              className="border rounded px-2 py-1"
              onClick={() => openQrFor(l.url)}
            >
              QR
            </button>
          </div>

          <div className="mt-2 text-sm flex flex-wrap gap-1">
            {(l.tags ?? []).length > 0 ? (
              (l.tags ?? []).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="px-2 py-0.5 rounded-full border text-xs opacity-80"
                  onClick={() => setTagFilter((cur) => (cur === t ? null : t))}
                  title="Filter by this tag"
                >
                  #{t}
                </button>
              ))
            ) : (
              <span className="text-xs opacity-50">No tags</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
