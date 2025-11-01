// src/AddLink.tsx
import React, { useState } from 'react';
import { auth, db } from './firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useI18n } from './i18n-provider';

function toHttpsOrNull(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;
  if (/^http:\/\//i.test(raw)) return null; // disallow plain http
  const withScheme = /^(https?:)?\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

export default function AddLink() {
  // Safe t() fallback so UI never shows "undefined"
  let t = (k: string) => k as unknown as string;
  try {
    const i = useI18n();
    if (i && typeof i.t === 'function') t = i.t;
  } catch {
    /* ignore if provider not mounted */
  }
  const T = (k: string, fb: string) => {
    try {
      const v = t?.(k);
      return (v ?? '').toString().trim() || fb;
    } catch {
      return fb;
    }
  };

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const doSave = async () => {
    const user = auth.currentUser;
    if (!user) return alert(T('pleaseSignIn', 'Please sign in first.'));
    if (!title.trim()) return alert(T('pleaseEnterTitle', 'Please enter a title.'));
    if (!language.trim()) return alert(T('pleaseEnterLanguage', 'Please enter the language.'));
    const urlHttps = toHttpsOrNull(url);
    if (!urlHttps) return alert(T('invalidUrl', 'Please enter a valid HTTPS URL (https://...)'));

    try {
      setSaving(true);
      await addDoc(collection(db, 'users', user.uid, 'links'), {
        name: title.trim(),
        language: language.trim(),
        url: urlHttps,
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setLanguage('');
      setUrl('');
      alert(T('saved', 'Saved!'));
    } catch (e: any) {
      alert(e?.message || T('saveFailed', 'Save failed. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // NEW: handle Enter/Return to save
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!saving) doSave();
  };

  return (
    <form className="max-w-md" onSubmit={onSubmit} noValidate>
      {/* Title (no label; placeholder + aria-label) */}
      <input
        id="title"
        name="title"
        aria-label={T('title', 'Title')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={T('title', 'Title')}
        className="w-full border rounded px-3 py-2 mb-3 not-italic"
        autoComplete="off"
      />

      {/* Language */}
      <input
        id="language"
        name="language"
        aria-label={T('languageOfContent', 'Language')}
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        placeholder={T('languageOfContent', 'Language')}
        className="w-full border rounded px-3 py-2 mb-3 not-italic"
        autoComplete="off"
      />

      {/* URL */}
      <input
        id="url"
        name="url"
        aria-label={T('url', 'URL')}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={T('url', 'URL')}
        className="w-full border rounded px-3 py-2 mb-1 not-italic"
        inputMode="url"
        autoComplete="off"
      />

      <div className="text-xs text-gray-500 mb-3 not-italic">
        {T('mustBeHttps', 'URL must be https (or leave off scheme to auto-https)')}
        <br />
        {T('pressEnterToSave', 'Tip: press Enter to save')}
      </div>

      <button
        type="submit" // <-- submit triggers onSubmit
        disabled={saving}
        className="not-italic"
        style={{
          background: '#A51931',
          color: '#F4F5F8',
          borderRadius: 9999,
          padding: '8px 16px',
          fontWeight: 600,
          fontStyle: 'normal',
        }}
        title={T('save', 'Save')}
      >
        {saving ? T('saving', 'Saving…') : T('save', 'Save')}
      </button>
    </form>
  );
}
