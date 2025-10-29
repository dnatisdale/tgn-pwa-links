// src/AddLink.tsx
import React, { useState } from 'react';
import type { Lang } from './i18n-provider';
import { auth, db } from './firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// helper: ensure https (auto-add if missing), reject http and invalid
function toHttpsOrNull(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^http:\/\//i.test(raw)) return null; // reject non-secure
  const withScheme = /^(https?:)?\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

export default function AddLink({ lang }: { lang: Lang }) {
  const L =
    lang === 'th'
      ? {
          name: 'ชื่อ',
          language: 'ภาษา',
          url: 'ลิงก์',
          save: 'บันทึก',
          saving: 'กำลังบันทึก…',
          saved: 'บันทึกแล้ว',
          signinFirst: 'กรุณาเข้าสู่ระบบก่อน',
          badUrl: 'ลิงก์ต้องเป็น https:// เท่านั้น หรือพิมพ์โดยไม่ต้องใส่ https://',
          needName: 'กรุณากรอกชื่อเรื่อง',
        }
      : {
          name: 'Name',
          language: 'Language',
          url: 'URL',
          save: 'Save',
          saving: 'Saving…',
          saved: 'Saved',
          signinFirst: 'Please sign in first.',
          badUrl: 'URL must be secure (https). You can type it with or without https://',
          needName: 'Please enter a name',
        };

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert(L.signinFirst);
      return;
    }

    const nameTrim = name.trim();
    const languageTrim = language.trim();
    const urlHttps = toHttpsOrNull(url);

    if (!nameTrim) {
      alert(L.needName);
      return;
    }
    if (!urlHttps) {
      alert(L.badUrl);
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, 'users', user.uid, 'links'), {
        name: nameTrim,
        language: languageTrim,
        url: urlHttps,
        createdAt: serverTimestamp(),
      });
      setName('');
      setLanguage('');
      setUrl('');
      alert(L.saved);
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
        placeholder={L.name}
        aria-label={L.name}
        className="w-full border rounded px-3 py-2 mb-3"
      />
      <input
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        placeholder={L.language}
        aria-label={L.language}
        className="w-full border rounded px-3 py-2 mb-3"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={L.url}
        aria-label={L.url}
        className="w-full border rounded px-3 py-2 mb-1"
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
        {lang === 'th'
          ? 'จะเพิ่ม https:// ให้อัตโนมัติ และไม่อนุญาต http://'
          : 'We’ll add https:// for you automatically; http:// is not allowed.'}
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="btn-red"
        style={{
          background: '#a51931',
          color: '#fff',
          borderRadius: 8,
          padding: '10px 16px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {saving ? L.saving : L.save}
      </button>
    </div>
  );
}
