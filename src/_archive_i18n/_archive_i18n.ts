// src/i18n.ts
export type Lang = 'en' | 'th';

export const tr = (key: string) => key;
export const t = (l: Lang) => ({
  appTitle: l === 'th' ? 'ข่าวประเสริฐภาษาไทย' : 'Thai Good News',
  browse: l === 'th' ? 'เรียกดู' : 'Browse',
  add: l === 'th' ? 'เพิ่มลิงก์' : 'Add',
  importExport: l === 'th' ? 'นำเข้า / ส่งออก' : 'Import / Export',
  logout: l === 'th' ? 'ออกจากระบบ' : 'Log Out',

  // Login / auth
  loginTitle: l === 'th' ? 'เข้าสู่ระบบด้วยอีเมล' : 'Sign in with Email',
  email: l === 'th' ? 'อีเมล' : 'Email',
  password: l === 'th' ? 'รหัสผ่าน' : 'Password',
  signIn: l === 'th' ? 'เข้าสู่ระบบ' : 'Sign In',
  signUp: l === 'th' ? 'สมัครสมาชิก' : 'Sign Up',

  // Add link
  name: l === 'th' ? 'ชื่อเรื่อง' : 'Title',
  language: l === 'th' ? 'ภาษา' : 'Language',
  url: l === 'th' ? 'พิมพ์ URL ของคุณที่นี่' : 'Type your URL here.',
  save: l === 'th' ? 'บันทึก' : 'Save',

  // Browse page
  searchPlaceholder: l === 'th' ? 'ค้นหาทุกภาษา…' : 'Search all languages…',
  size: l === 'th' ? 'ขนาดตัวอักษร' : 'Text size',
  small: l === 'th' ? 'เล็ก' : 'Small',
  medium: l === 'th' ? 'กลาง' : 'Medium',
  large: l === 'th' ? 'ใหญ่' : 'Large',
  filterAll: l === 'th' ? 'ทั้งหมด' : 'All',
  filterThai: l === 'th' ? 'เฉพาะภาษาไทย' : 'Thai only',
  share: l === 'th' ? 'แชร์' : 'Share',
  emailShare: l === 'th' ? 'อีเมล' : 'Email',
  fbShare: l === 'th' ? 'เฟซบุ๊ก' : 'Facebook',
  xShare: l === 'th' ? 'เอ็กซ์' : 'X / Twitter',
  waShare: l === 'th' ? 'วอทส์แอป' : 'WhatsApp',
  copyLink: l === 'th' ? 'คัดลอกลิงก์' : 'Copy Link',

  // Import / Export pages
  importJSON: l === 'th' ? 'นำเข้า JSON' : 'JSON',
  importCSV: l === 'th' ? 'นำเข้า CSV' : 'CSV',
  exportJSON: l === 'th' ? 'ส่งออก JSON' : 'JSON',

  // Empty state
  empty:
    l === 'th'
      ? 'ยังไม่มีลิงก์ — กด เพิ่มลิงก์ เพื่อเริ่มต้น'
      : 'No links yet — click ADD to create your first one.',

  // PWA update toast
  newVersion: l === 'th' ? 'มีเวอร์ชันใหม่พร้อมใช้งาน' : 'New Version Available',
  refresh: l === 'th' ? 'รีเฟรช' : 'Refresh',
  skip: l === 'th' ? 'ข้าม' : 'Skip',

  // Topbar extras
  install: l === 'th' ? 'ติดตั้ง' : 'Install',
  sharePwa: l === 'th' ? 'แชร์ PWA' : 'Share PWA',
});

// ──────────────────────────────────────────────────────────────
// TGN i18n compatibility API (append to the end of i18n.ts)
// Keeps your existing dictionaries intact, but exposes a common API.
// ──────────────────────────────────────────────────────────────
// export type Lang = 'en' | 'th';.

// 1) Current language (initialize from <html lang> or localStorage)
let __lang: Lang =
  (typeof document !== 'undefined' && (document.documentElement.lang?.toLowerCase() as Lang)) ||
  (typeof localStorage !== 'undefined' && (localStorage.getItem('tgn.lang') as Lang)) ||
  'en';

// 2) A small listener set so React (and others) can subscribe
const __listeners = new Set<(l: Lang) => void>();

/** Read the current language */
export function getLang(): Lang {
  return __lang;
}

/** Set the current language + persist + notify listeners */
export function setLang(next: Lang) {
  if (next !== 'en' && next !== 'th') next = 'en';
  __lang = next;
  try {
    if (typeof document !== 'undefined') document.documentElement.lang = next;
    if (typeof localStorage !== 'undefined') localStorage.setItem('tgn.lang', next);
  } catch {}
  // Notify anyone listening (React provider, components, etc.)
  __listeners.forEach((fn) => fn(next));
}

/** Subscribe to language changes; returns an unsubscribe function */
export function onLangChange(fn: (l: Lang) => void) {
  __listeners.add(fn);
  // Return a cleanup that returns void (not boolean)
  return () => {
    __listeners.delete(fn);
  };
}

/**
 * getTranslator: adapt your existing dictionaries to a (key) => string fn
 * If you already export a `t()` in this file, feel free to re-export it below
 * and ignore this helper.
 */
export function getTranslator<T extends Record<string, string>>(catalog: Record<Lang, T>) {
  return function t<K extends keyof T & string>(key: K): string {
    const lang = getLang();
    const byLang = catalog[lang] || (catalog as any).en || {};
    return (byLang[key] ?? (catalog as any).en?.[key] ?? key) as string;
  };
}

// OPTIONAL: If you already have `catalog` here, you can export a ready `t()`:
//
//   export const t = getTranslator(catalog)
//
// Otherwise, your React layer can pass in its own catalog.
