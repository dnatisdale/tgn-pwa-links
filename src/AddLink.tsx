import React, { useState } from 'react';
import { auth, db } from './firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useI18n } from './i18n-provider';

function toHttpsOrNull(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^http:\/\//i.test(raw)) return null;
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
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const user = auth.currentUser;
    if (!user) return alert(t('pleaseSignIn'));
    if (!name.trim()) return alert(t('title'));
    const urlHttps = toHttpsOrNull(url);
    if (!urlHttps) return alert(t('invalidUrl'));

    try {
      setSaving(true);
      await addDoc(collection(db, 'users', user.uid, 'links'), {
        name: name.trim(),
        language: language.trim(),
        url: urlHttps,
        createdAt: serverTimestamp(),
      });
      setName('');
      setLanguage('');
      setUrl('');
      alert(t('saved'));
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('title')}
        className="w-full border rounded px-3 py-2 mb-3"
      />
      <input
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        placeholder={t('languageOfContent')}
        className="w-full border rounded px-3 py-2 mb-3"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={t('url')}
        className="w-full border rounded px-3 py-2 mb-1"
        inputMode="url"
      />
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>{t('mustBeHttps')}</div>
      <button onClick={onSave} disabled={saving} className="btn btn-red">
        {saving ? t('saving') : t('save')}
      </button>
    </div>
  );
}
