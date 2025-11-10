// src/adminConfig.ts

const ADMIN_EMAILS = ['dant.grnt@gmail.com'];

export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return ADMIN_EMAILS.includes(lower);
}
