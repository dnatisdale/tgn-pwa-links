import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

/**
 * Sends a plain-text "Share Card" email via EmailJS.
 * Your EmailJS template should define variables: subject, message, to_email
 */
export async function sendEmail(params: { to: string; subject: string; message: string }) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error('Missing EmailJS env vars. Check .env.local');
  }

  const templateParams = {
    to_email: params.to,
    subject: params.subject,
    message: params.message,
  };

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, { publicKey: PUBLIC_KEY });
}
