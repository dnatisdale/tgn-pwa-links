// src/Contact.tsx
import React, { useMemo, useState } from 'react';
import { useI18n } from './i18n-provider';

export default function Contact() {
  // Safe i18n helper
  let t = (k: string) => k;
  try {
    // @ts-ignore
    const i = useI18n?.();
    if (i && typeof i.t === 'function') t = i.t;
  } catch {}
  const tOr = (k: string, fb: string) => {
    try {
      const v = t?.(k);
      return (v ?? '').toString().trim() || fb;
    } catch {
      return fb;
    }
  };

  const toAddress = useMemo(() => 'Thai@globalrecordings.net', []);

  const [name, setName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      `${tOr('contactSubject', 'TGN Contact')}: ${name || tOr('yourName', 'Your name')}`
    );
    const body = encodeURIComponent(`From: ${name} <${fromEmail}>\n\n${message}`);
    window.location.href = `mailto:${toAddress}?subject=${subject}&body=${body}`;
  };

  return (
    <section className="max-w-2xl mx-auto p-3">
      <h2 className="text-lg font-semibold mb-2 not-italic">{tOr('contact', 'Contact')}</h2>

      <p className="text-sm text-gray-800 not-italic mb-4">
        {tOr('contactIntro', 'Questions or feedback? Please email us at')}{' '}
        <a className="underline" href={`mailto:${toAddress}`}>
          {toAddress}
        </a>
      </p>

      {/* Minimal contact form (mailto) */}
      <form onSubmit={onSubmit} noValidate>
        <input
          id="contactName"
          name="contactName"
          aria-label={tOr('yourName', 'Your name')}
          className="w-full border rounded px-3 py-2 mb-3 not-italic"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder={tOr('yourName', 'Your name')}
        />

        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          aria-label={tOr('yourEmail', 'Your email')}
          className="w-full border rounded px-3 py-2 mb-3 not-italic"
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          autoComplete="email"
          inputMode="email"
          placeholder={tOr('yourEmail', 'Your email')}
        />

        <textarea
          id="contactMsg"
          name="contactMsg"
          rows={6}
          aria-label={tOr('message', 'Message')}
          className="w-full border rounded px-3 py-2 mb-3 not-italic"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={tOr('message', 'Message')}
        />

        <button
          type="submit"
          className="btn btn-red not-italic"
          style={{
            borderRadius: 9999,
            padding: '8px 16px',
            fontWeight: 700,
            fontStyle: 'normal', // <-- hard-force non-italic
          }}
          title={tOr('send', 'Send')}
        >
          {tOr('send', 'Send')}
        </button>
      </form>
    </section>
  );
}
