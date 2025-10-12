// src/i18n.ts
export type Lang = 'en' | 'th';

export const strings = {
  en: {
    appTitle: 'Thai Good News',
    browse: 'Browse',
    add: 'Add',
    import: 'Import', // must be just “Import”
    export: 'Export',
    about: 'About',
    installPwa: 'Install PWA',
    sharePwa: 'Share PWA',
    signIn: 'Save / Sign in',
    continueGuest: 'Continue as guest',
    name: 'Name',
    language: 'Language',
    url: 'URL (https)',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    print: 'Print',
    pdf: 'PDF',
    csv: 'CSV',
    newVersion: 'New Version Available',
    refresh: 'Refresh',
    skip: 'Skip',
    share: 'Share',
    copyLinks: 'Copy links',
    emailLinks: 'Email links + QR',
    tipInvalid:
      'Tip: if URL (https) is empty, we rejected it (http or invalid). Fix your file and re-import.',
  },
  th: {
    appTitle: 'ข่าวดีภาษาไทย',
    browse: 'ดูรายการ',
    add: 'เพิ่ม',
    import: 'นำเข้า',
    export: 'ส่งออก',
    about: 'เกี่ยวกับ',
    installPwa: 'ติดตั้งแอป',
    sharePwa: 'แชร์แอป',
    signIn: 'บันทึก / เข้าสู่ระบบ',
    continueGuest: 'เข้าต่อแบบผู้เยี่ยมชม',
    name: 'ชื่อ',
    language: 'ภาษา',
    url: 'ลิงก์ (https)',
    save: 'บันทึก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    print: 'พิมพ์',
    pdf: 'PDF',
    csv: 'CSV',
    newVersion: 'มีเวอร์ชันใหม่',
    refresh: 'รีเฟรช',
    skip: 'ข้าม',
    share: 'แชร์',
    copyLinks: 'คัดลอกลิงก์',
    emailLinks: 'อีเมลลิงก์ + QR',
    tipInvalid:
      'เคล็ดลับ: ถ้า URL (https) ว่าง เราปฏิเสธ (http หรือไม่ถูกต้อง) กรุณาแก้ไฟล์แล้วนำเข้าใหม่',
  },
} as const satisfies Record<Lang, Record<string, string>>;

// Optional convenience helper so existing imports `tr` work:
export function tr(lang: Lang, key: string): string {
  // If you want stricter typing, change `key: string` to
  // `key: keyof typeof strings['en'] | keyof typeof strings['th']`
  return strings[lang]?.[key] ?? key;
}

// Optional: strongly-typed keys (useful for autocompletion):
export type I18nKey = keyof typeof strings['en'];
