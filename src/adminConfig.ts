// src/adminConfig.ts

const ADMIN_EMAILS = [
  'dant.grnt@Gmail.com', // exact email from Firebase Auth -> Users
];

export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
