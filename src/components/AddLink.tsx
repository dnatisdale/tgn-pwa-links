// src/components/AddLink.tsx

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n-provider';

// Normalize to https:// when possible, with a small typo check.
const normalizeUrlToHttps = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let candidate = trimmed;

  // If no scheme, assume https://
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const u = new URL(candidate);

    // If http, upgrade to https
    if (u.protocol === 'http:') {
      u.protocol = 'https:';
    }

    // Only accept https in the end
    if (u.protocol !== 'https:') return null;

    const host = u.hostname.toLowerCase();

    // Require something that looks like a real host (has a dot, unless localhost)
    if (host !== 'localhost' && !host.includes('.')) {
      return null;
    }

    // Catch common typo like "http5fi.sh" (starts with "http" followed by a digit)
    if (/^http\d/i.test(host)) {
      return null;
    }

    return u.toString();
  } catch {
    return null;
  }
};

// Split tags by commas/spaces, strip "#", dedupe case-insensitively
const parseTags = (input: string): string[] => {
  const parts = input
    .split(/[,\s]+/)
    .map((t) => t.trim().replace(/^#/, ''))
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of parts) {
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }
  return out;
};

export default function AddLink() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Extra safety; App.tsx already gates this route
  if (!user) {
    return <p className="text-center text-gray-500">Sign in to add links.</p>;
  }

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const normalized = normalizeUrlToHttps(url);
    if (!normalized) {
      setError(
        t?.('invalidUrl', 'Please enter a valid link (we will use secure https://).') ??
          'Please enter a valid link (we will use secure https://).'
      );
      return;
    }

    const tags = parseTags(tagsRaw);
    const cleanTitle = title.trim();

    const docToSave = {
      url: normalized,
      title: cleanTitle || normalized,
      tags,
      createdAt: serverTimestamp(),
    };

    try {
      setSaving(true);
      await addDoc(collection(db, 'users', user.uid, 'links'), docToSave);
      setSuccess(t?.('addLinkSaved', 'Saved ✅') ?? 'Saved ✅');

      setUrl('');
      setTitle('');
      setTagsRaw('');
    } catch (e) {
      console.error('Save failed:', e);
      setError(
        t?.('saveFailed', 'Save failed. Please try again.') ?? 'Save failed. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="max-w-xl mx-auto p-4 space-y-3 border rounded"
      onSubmit={(e) => {
        e.preventDefault();
        if (!saving) handleSave();
      }}
    >
      {/* URL input – no external label */}
      <input
        className="input-style w-full"
        type="text"
        inputMode="url"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={
          t?.('phAddUrl', 'Paste or type your link here') ?? 'Paste or type your link here'
        }
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />

      {/* Title input – optional */}
      <input
        className="input-style w-full"
        type="text"
        placeholder={
          t?.('phAddTitle', 'Give it a short title (optional)') ??
          'Give it a short title (optional)'
        }
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Tags input – # optional, spaces/commas allowed */}
      <input
        className="input-style w-full"
        type="text"
        placeholder={
          t?.('phAddTags', 'Add keywords separated by spaces or commas') ??
          'Add keywords separated by spaces or commas'
        }
        value={tagsRaw}
        onChange={(e) => setTagsRaw(e.target.value)}
      />

      {(error || success) && (
        <div
          className={`text-sm rounded px-3 py-2 ${
            error
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="btn btn-blue font-krub"
          disabled={saving}
          title="Save (Enter key works too)"
        >
          {saving
            ? t?.('saving', 'Saving…') ?? 'Saving…'
            : t?.('addLink', 'Add link') ?? 'Add link'}
        </button>

        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={() => {
            setUrl('');
            setTitle('');
            setTagsRaw('');
            setError(null);
            setSuccess(null);
          }}
        >
          {t?.('clear', 'Clear') ?? 'Clear'}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        {t?.('tipEnterToSave', 'Tip: Press Enter in any field to save.') ??
          'Tip: Press Enter in any field to save.'}
      </p>
    </form>
  );
}
