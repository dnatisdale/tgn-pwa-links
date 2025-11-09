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
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { sendEmail } from '../utils/email';
import { formatUrl } from '../utils/formatUrl';
import QRCode from 'qrcode';
import {
  renderCardCanvas,
  downloadCardPng,
  copyCardToClipboard,
  shareCardIfPossible,
  openCardPreview,
  type CardSize,
  type CardOrientation,
} from '../qrCard';
import LanguageSidebar from './LanguageSidebar';

type LinkDoc = {
  id: string;
  url: string;
  title?: string;
  tags?: string[];
  language?: string; // optional: used by sidebar filter
  createdAt?: Timestamp | null;
};

export default function LinksList() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [textFilter, setTextFilter] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [scope, setScope] = useState<'all' | 'title' | 'url' | 'tags'>('all');
  const [orientation, setOrientation] = useState<CardOrientation>('portrait');

  // Share Card options
  const [includeQr, setIncludeQr] = useState<boolean>(false);
  const [qrSize, setQrSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Language sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [activeLangs, setActiveLangs] = useState<string[]>([]); // selected language codes

  // Live Firestore
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
            url: data.url ?? '',
            title: data.title ?? '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            language: (data.language || data.lang || '').toString().trim() || undefined,
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

  // Helpers
  const fmt = (ts?: Timestamp | null) => (ts ? new Date(ts.seconds * 1000).toLocaleString() : '');

  const faviconFor = (rawUrl: string) => {
    try {
      // Ensure we have a proper URL object, add https:// if missing
      const hasScheme = /^https?:\/\//i.test(rawUrl);
      const urlObj = new URL(hasScheme ? rawUrl : `https://${rawUrl}`);

      const host = urlObj.hostname.toLowerCase();

      // Basic sanity: must contain a dot and not be just "http" / "https"
      if (!host.includes('.') || host === 'http' || host === 'https') {
        return '';
      }

      return `https://icons.duckduckgo.com/ip3/${host}.ico`;
    } catch {
      // Any parsing problem → no favicon request
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

  // Toggle language selection from sidebar
  const toggleLang = (code: string) => {
    const key = code.toLowerCase();
    setActiveLangs((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  };

  // Filtered links (existing filters + language filter)
  const filtered = useMemo(() => {
    let rows = links;

    // language filter
    if (activeLangs.length > 0) {
      rows = rows.filter((l) => {
        const lang = (l.language || '').toLowerCase();
        return lang && activeLangs.includes(lang);
      });
    }

    // tag filter
    if (tagFilter) {
      rows = rows.filter((l) => (l.tags ?? []).includes(tagFilter));
    }

    // text filter
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
  }, [links, tagFilter, rx, scope, activeLangs]);

  // Tag cloud (top 12)
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    links.forEach((l) => (l.tags ?? []).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [links]);

  // Export visible (unchanged)
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

  // Unified Share/Copy/Email (unchanged)
  const sizePx = (s: 'sm' | 'md' | 'lg') => (s === 'sm' ? 128 : s === 'lg' ? 384 : 256);

  const composeCardText = (l: LinkDoc) => {
    const title = l.title?.trim() || '(no title)';
    const url = l.url || '';
    const tags = (l.tags ?? []).join(', ');
    const when = fmt(l.createdAt);
    return [
      `Title: ${title}`,
      `URL: ${url}`,
      tags ? `Tags: ${tags}` : `Tags: —`,
      when ? `Saved: ${when}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const makeQrBlob = async (url: string, pixels: number): Promise<Blob> => {
    const dataUrl = await QRCode.toDataURL(url, {
      width: pixels,
      margin: 1,
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const shareCard = async (
    l: LinkDoc,
    mode: 'share' | 'copy' | 'email',
    withQr: boolean,
    qrsz: 'sm' | 'md' | 'lg'
  ) => {
    const text = composeCardText(l);

    if (mode === 'email') {
      const to = prompt('Send to which email address?')?.trim();
      if (!to) return;
      const subj = l.title?.trim() || 'Shared link';
      try {
        await sendEmail({ to, subject: subj, message: text });
        alert('Email sent ✅');
      } catch (e) {
        console.error(e);
        alert('Email failed. Check console and your EmailJS keys/template.');
      }
      return;
    }

    if (mode === 'share' && navigator.share) {
      try {
        if (withQr) {
          const blob = await makeQrBlob(l.url, sizePx(qrsz));
          const file = new File([blob], 'qr.png', {
            type: 'image/png',
          });
          if ((navigator as any).canShare?.({ files: [file] })) {
            await navigator.share({
              title: l.title || 'Link',
              text,
              url: l.url,
              files: [file],
            });
            return;
          }
        }
        await navigator.share({
          title: l.title || 'Link',
          text,
          url: l.url,
        });
        return;
      } catch {
        // fall through to copy on failure
      }
    }

    try {
      if (withQr && 'ClipboardItem' in window) {
        const blob = await makeQrBlob(l.url, sizePx(qrsz));
        const item = new (window as any).ClipboardItem({
          'text/plain': new Blob([text], {
            type: 'text/plain',
          }),
          'image/png': blob,
        });
        await (navigator.clipboard as any).write([item]);
        alert('Card + QR copied to clipboard.');
        return;
      }
      await navigator.clipboard.writeText(text);
      alert('Card text copied to clipboard.');
    } catch {
      alert('Copy failed. You can select and copy manually.');
    }
  };

  // Fix malformed URLs (unchanged)
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

  // Render states
  if (!user) {
    return <p className="text-center text-gray-500">Sign in to view links.</p>;
  }

  if (loading) {
    return <p className="text-center text-gray-500">Loading links…</p>;
  }

  if (links.length === 0) {
    return <p className="text-center text-gray-500">No links yet.</p>;
  }

  // Layout: sidebar + main (responsive)
  return (
    <div className="flex max-w-6xl mx-auto">
      {/* Left sidebar: permanent on lg, slide-in on mobile */}
      <LanguageSidebar
        links={links}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeLangs={activeLangs}
        onToggleLang={toggleLang}
      />

      {/* Right main content */}
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

        {/* Controls */}
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

            {/* Card / QR options */}
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
              Include QR
            </label>

            <button
              type="button"
              className="btn btn-blue font-krub"
              onClick={() => {
                setTextFilter('');
                setTagFilter(null);
                setActiveLangs([]);
              }}
              title="Clear search, tags, and languages"
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

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
          {filtered.map((l) => {
            const icon = faviconFor(l.url);

            return (
              <div key={l.id} className="border rounded p-3 bg-white shadow-sm h-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {icon && (
                      <img
                        src={icon}
                        alt=""
                        className="w-4 h-4 rounded-sm shrink-0"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="font-semibold truncate">{l.title || '(no title)'}</div>
                  </div>
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

                {/* Actions */}
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={() => shareCard(l, 'share', includeQr, qrSize)}
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={() => shareCard(l, 'copy', includeQr, qrSize)}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={() => shareCard(l, 'email', includeQr, qrSize)}
                  >
                    Email
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={async () => {
                      const c = await renderCardCanvas({
                        title: l.title || '(no title)',
                        url: l.url,
                        size: qrSize,
                        orientation,
                      });
                      await openCardPreview(c);
                    }}
                    title="Preview PNG card in a new tab"
                  >
                    Preview
                  </button>

                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={async () => {
                      const c = await renderCardCanvas({
                        title: l.title || '(no title)',
                        url: l.url,
                        size: qrSize,
                        orientation,
                      });
                      const filename = `${(l.title || 'link').slice(0, 40)}.png`;
                      const shared = await shareCardIfPossible(filename, c);
                      if (!shared) {
                        await downloadCardPng(filename, c);
                      }
                    }}
                    title="Share PNG (fallback to download if share unsupported)"
                  >
                    Share / Download
                  </button>

                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={async () => {
                      const c = await renderCardCanvas({
                        title: l.title || '(no title)',
                        url: l.url,
                        size: qrSize,
                        orientation,
                      });
                      try {
                        await copyCardToClipboard(c);
                        alert('PNG card copied to clipboard ✅');
                      } catch {
                        alert(
                          'Copying images is not supported in this browser. Try “Preview” then save.'
                        );
                      }
                    }}
                    title="Copy PNG to clipboard"
                  >
                    Copy PNG
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
          {filtered.map((l) => {
            const icon = faviconFor(l.url);

            return (
              <div key={l.id} className="border rounded p-3 bg-white shadow-sm h-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {icon && (
                      <img
                        src={icon}
                        alt=""
                        className="w-4 h-4 rounded-sm shrink-0"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="font-semibold truncate">{l.title || '(no title)'}</div>
                  </div>
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

                {/* Actions */}
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={() => shareCard(l, 'share', includeQr, qrSize)}
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={() => shareCard(l, 'copy', includeQr, qrSize)}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={() => shareCard(l, 'email', includeQr, qrSize)}
                  >
                    Email
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={async () => {
                      const c = await renderCardCanvas({
                        title: l.title || '(no title)',
                        url: l.url,
                        size: qrSize,
                        orientation,
                      });
                      await openCardPreview(c);
                    }}
                    title="Preview PNG card in a new tab"
                  >
                    Preview
                  </button>

                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={async () => {
                      const c = await renderCardCanvas({
                        title: l.title || '(no title)',
                        url: l.url,
                        size: qrSize,
                        orientation,
                      });
                      const filename = `${(l.title || 'link').slice(0, 40)}.png`;
                      const shared = await shareCardIfPossible(filename, c);
                      if (!shared) {
                        await downloadCardPng(filename, c);
                      }
                    }}
                    title="Share PNG (fallback to download if share unsupported)"
                  >
                    Share / Download
                  </button>

                  <button
                    type="button"
                    className="border rounded px-2 py-1"
                    onClick={async () => {
                      const c = await renderCardCanvas({
                        title: l.title || '(no title)',
                        url: l.url,
                        size: qrSize,
                        orientation,
                      });
                      try {
                        await copyCardToClipboard(c);
                        alert('PNG card copied to clipboard ✅');
                      } catch {
                        alert(
                          'Copying images is not supported in this browser. Try “Preview” then save.'
                        );
                      }
                    }}
                    title="Copy PNG to clipboard"
                  >
                    Copy PNG
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
