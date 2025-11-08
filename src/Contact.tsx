// src/Contact.tsx
import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { useI18n } from './i18n-provider';

type TFunc = (k: string) => string;
const tOr = (t?: TFunc) => (k: string, fb: string) => {
  try {
    return t && typeof t === 'function' ? t(k) : fb;
  } catch {
    return fb;
  }
};

const MAX_MESSAGE_LEN = 500;
const RATE_LIMIT_MS = 8000;

export default function Contact() {
  let t: TFunc = (k) => k;
  try {
    const i = (useI18n?.() as any) || null;
    if (i && typeof i.t === 'function') t = i.t as TFunc;
  } catch {}

  const tt = tOr(t);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const formRef = useRef<HTMLFormElement>(null);

  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

  const resetStatus = () => {
    setStatus('idle');
    setErrorMsg('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();

    if (cooldown) {
      setStatus('error');
      setErrorMsg(tt('contactErrorCooldown', 'Please wait a moment.'));
      return;
    }

    if (website.trim()) {
      setStatus('error');
      setErrorMsg(tt('contactErrorGeneric', 'Send failed. Try again.'));
      return;
    }

    const msg = message.trim();
    if (!email.trim() || !msg) {
      setStatus('error');
      setErrorMsg(tt('contactErrorMissing', 'Email + message required.'));
      return;
    }
    if (msg.length > MAX_MESSAGE_LEN) {
      setStatus('error');
      setErrorMsg(tt('contactErrorTooLong', `Max ${MAX_MESSAGE_LEN} chars.`));
      return;
    }

    setSending(true);
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          from_name: name || 'Unknown',
          from_email: email,
          message: msg,
          app_name: 'Thai Good News PWA',
        },
        { publicKey: PUBLIC_KEY }
      );

      setStatus('sent');
      setName('');
      setEmail('');
      setMessage('');
      setWebsite('');
      setCooldown(true);
      setTimeout(() => setCooldown(false), RATE_LIMIT_MS);
    } catch {
      setStatus('error');
      setErrorMsg(tt('contactErrorGeneric', 'Send failed. Try again.'));
    } finally {
      setSending(false);
    }
  };

  const disableSend = sending || cooldown;

  return (
    <section className="w-full max-w-3xl mx-auto px-4 sm:px-6">
      <form ref={formRef} onSubmit={onSubmit} className="space-y-2" noValidate>
        <input
          id="contactName"
          name="contactName"
          aria-label={tt('contactName', 'Name')}
          className="w-full rounded-xl border border-black/30 p-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder={tt('phContactName', 'Name')}
        />

        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          aria-label={tt('contactEmail', 'Email')}
          className="w-full rounded-xl border border-black/30 p-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder={tt('phContactEmail', 'Email')}
          required
        />

        {/* Honeypot */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="relative">
          <textarea
            id="message"
            name="message"
            aria-label={tt('phContactMessage', 'Message')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            placeholder={tt('phContactMessage', 'Message')}
            className="w-full border rounded px-3 py-2 pr-16 not-italic"
            rows={6}
            required
          />
          <span className="counter-inside">{message.length}/500</span>
        </div>

        {status === 'sent' && <p className="text-sm">{tt('contactSuccess', 'Sent ✅')}</p>}
        {status === 'error' && (
          <p className="text-sm">
            {tt('contactError', 'Error:')} {errorMsg}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-red"
          style={{
            borderRadius: 9999,
            padding: '8px 16px',
            fontWeight: 600,
            fontStyle: 'normal',
          }}
          title={tt('contactSend', 'Send')}
          disabled={disableSend}
        >
          {sending
            ? tt('contactSending', 'Sending…')
            : cooldown
            ? tt('contactCooling', 'Wait…')
            : tt('contactSend', 'Send')}
        </button>
      </form>
    </section>
  );
}
