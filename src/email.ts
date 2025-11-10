// src/email.ts
export type SendEmailParams = { to: string; subject: string; message: string };

export async function sendEmail({ to, subject, message }: SendEmailParams): Promise<void> {
  if (typeof window === 'undefined') return;
  const mailto =
    'mailto:' +
    encodeURIComponent(to || '') +
    '?subject=' +
    encodeURIComponent(subject || '') +
    '&body=' +
    encodeURIComponent(message || '');
  window.location.href = mailto;
}
