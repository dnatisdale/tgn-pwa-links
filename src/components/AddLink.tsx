// src/components/AddLink.tsx
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { formatUrl } from '../utils/formatUrl';

export default function AddLink() {
  const { user } = useAuth();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tagsRaw, setTagsRaw] = useState(''); // comma or space separated
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) {
    return <p className="text-center text-gray-500">Sign in to add links.</p>;
  }

  // Parse "tagsRaw" into a deduped array of non-empty strings
  const parseTags = (input: string): string[] => {
    const parts = input
      .split(/[,\s]+/) // split by comma or whitespace
      .map((t) => t.trim())
      .filter(Boolean);
    // dedupe while preserving order
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of parts) {
      const lower = t.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        out.push(t);
      }
    }
    return out;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    // 1) Validate & normalize URL
    const normalized = formatUrl(url);
    if (!normalized) {
      setError('Please enter a valid URL (e.g., https://example.com/page).');
      return;
    }

    // 2) Build doc
    const docToSave = {
      url: normalized,
      title: title.trim(),
      tags: parseTags(tagsRaw),
      createdAt: serverTimestamp(),
    };

    // 3) Write
    try {
      setSaving(true);
      await addDoc(collection(db, 'users', user.uid, 'links'), docToSave);
      setSuccess('Saved ✅');

      // 4) Clear form (keep tags if you prefer, but most folks expect a full clear)
      setUrl('');
      setTitle('');
      setTagsRaw('');
    } catch (e) {
      console.error('Save failed:', e);
      setError('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    // ✅ Enter now submits the form because onSubmit → handleSave and the button is type="submit"
    <form
      className="max-w-xl mx-auto p-4 space-y-3 border rounded"
      onSubmit={(e) => {
        e.preventDefault();
        if (!saving) handleSave();
      }}
    >
      <h2 className="text-lg font-semibold">Add a new link</h2>

      <label className="block">
        <span className="text-sm opacity-80">URL</span>
        <input
          className="input-style w-full"
          type="url"
          placeholder="https://example.com/page"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </label>

      <label className="block">
        <span className="text-sm opacity-80">Title (optional)</span>
        <input
          className="input-style w-full"
          type="text"
          placeholder="Readable title for this link"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm opacity-80">Tags (comma or space separated)</span>
        <input
          className="input-style w-full"
          type="text"
          placeholder="news, thai, audio"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
        />
      </label>

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
          {saving ? 'Saving…' : 'Save'}
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
          Clear
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Tip: Press <kbd>Enter</kbd> in any field to save.
      </p>
    </form>
  );
}
