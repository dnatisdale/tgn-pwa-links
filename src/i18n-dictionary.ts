// src/i18n-dictionary.ts
// One source of truth for all UI strings. Keys must be UNIQUE.

const en = {
  // --- Application / Navigation ---
  appName: 'Thai Good News',
  about: 'About',
  aboutText: 'Thai Good News — a simple PWA for saving, sharing, and printing QR link cards.',
  browse: 'Browse',
  contact: 'Contact',
  install: 'Install',

  // --- Authentication ---
  signIn: 'Sign In',
  signUp: 'Sign Up',
  logout: 'Log Out',
  continueAsGuest: 'Continue as Guest',
  email: 'Email',
  password: 'Password',
  logoutFailed: 'Could not log out. Please try again.',

  // --- Search / Filters ---
  search: 'Search all languages...',
  all: 'All',
  thai: 'Thai only',

  // --- Common Actions ---
  add: 'ADD',
  save: 'Save',
  saving: 'Saving…',
  saved: 'Saved',
  edit: 'Edit',
  delete: 'Delete',
  close: 'Close',
  refresh: 'Refresh',
  print: 'Print',

  // --- Import / Export ---
  import: 'Import',
  export: 'Export',
  exportCsv: 'Export CSV',
  exportJson: 'Export JSON',
  chooseFile: 'Choose file',
  file: 'File',
  preview: 'Preview',
  valid: 'valid',
  invalid: 'Invalid',
  ok: 'OK',
  nothingToImport: 'Nothing to import.',
  importComplete: 'Import complete',
  tipExportsFiltered: 'Tip: Exports include only what’s currently in your list.',

  // --- List / Selection ---
  select: 'Select',
  selectAll: 'Select all',
  selectAtLeastOne: 'Select at least one item',
  downloadQRCards: 'Download QR cards',

  // --- Share ---
  share: 'Share',
  copyLink: 'Copy link',
  urlCopied: 'Link copied!',

  // --- Fields / Validation ---
  title: 'Title',
  languageOfContent: 'Language',
  url: 'URL',
  invalidUrl: 'URL must be secure (https). You can type it with or without https://',
  mustBeHttps: 'URL must be https (or leave off scheme to auto-https)',

  // --- Contact Screen ---
  contactTitle: 'Contact',
  contactName: 'Name',
  contactEmail: 'Email',
  contactMessage: 'Message',
  contactSend: 'Send',
  contactSending: 'Sending…',
  contactCooling: 'Wait…',
  contactSuccess: 'Sent ✅',
  contactError: 'Error:',
  contactErrorMissing: 'Email + message required.',
  contactErrorTooLong: 'Max 500 chars.',
  contactErrorCooldown: 'Please wait a moment.',
  contactErrorGeneric: 'Send failed. Try again.',
  phContactName: 'Name',
  phContactEmail: 'Email',
  phContactMessage: 'Message',

  // --- QR ---
  enlargeQR: 'Enlarge QR',
  shrinkQR: 'Shrink QR',

  // --- Update / PWA ---
  updateAvailable: 'New Version',
} as const;

const th = {
  // --- Application / Navigation ---
  appName: 'Thai Good News',
  about: 'เกี่ยวกับ',
  aboutText: 'Thai Good News — แอปสำหรับบันทึก แบ่งปัน และพิมพ์การ์ด QR ของลิงก์ได้อย่างง่ายดาย',
  browse: 'เรียกดู',
  contact: 'ติดต่อ',
  install: 'ติดตั้ง',

  // --- Authentication ---
  signIn: 'เข้าสู่ระบบ',
  signUp: 'สมัครสมาชิก',
  logout: 'ออกจากระบบ',
  continueAsGuest: 'เข้าชมแบบผู้เยี่ยมชม',
  email: 'อีเมล',
  password: 'รหัสผ่าน',
  logoutFailed: 'ออกจากระบบไม่สำเร็จ โปรดลองอีกครั้ง',

  // --- Search / Filters ---
  search: 'ค้นหาทุกภาษา...',
  all: 'ทั้งหมด',
  thai: 'เฉพาะภาษาไทย',

  // --- Common Actions ---
  add: 'เพิ่ม',
  save: 'บันทึก',
  saving: 'กำลังบันทึก…',
  saved: 'บันทึกแล้ว',
  edit: 'แก้ไข',
  delete: 'ลบ',
  close: 'ปิด',
  refresh: 'รีเฟรช',
  print: 'พิมพ์',

  // --- Import / Export ---
  import: 'นำเข้า',
  export: 'ส่งออก',
  exportCsv: 'ส่งออก CSV',
  exportJson: 'ส่งออก JSON',
  chooseFile: 'เลือกไฟล์',
  file: 'ไฟล์',
  preview: 'พรีวิว',
  valid: 'ถูกต้อง',
  invalid: 'ไม่ถูกต้อง',
  ok: 'ตกลง',
  nothingToImport: 'ไม่มีข้อมูลสำหรับนำเข้า',
  importComplete: 'นำเข้าสำเร็จ',
  tipExportsFiltered: 'เคล็ดลับ: การส่งออกจะรวมเฉพาะรายการที่อยู่ในรายการของคุณตอนนี้เท่านั้น',

  // --- List / Selection ---
  select: 'เลือก',
  selectAll: 'เลือกทั้งหมด',
  selectAtLeastOne: 'เลือกอย่างน้อยหนึ่งรายการ',
  downloadQRCards: 'ดาวน์โหลดการ์ด QR',

  // --- Share ---
  share: 'แชร์',
  copyLink: 'คัดลอกลิงก์',
  urlCopied: 'คัดลอกลิงก์แล้ว',

  // --- Fields / Validation ---
  title: 'ชื่อเรื่อง',
  languageOfContent: 'ภาษา',
  url: 'ลิงก์',
  invalidUrl: 'ลิงก์ต้องเป็น https เท่านั้น หรือพิมพ์โดยไม่ต้องใส่ https://',
  mustBeHttps: 'ลิงก์ต้องเป็น https (หรือเว้นไม่ใส่คำนำหน้าเพื่อให้เพิ่ม https อัตโนมัติ)',

  // --- Contact Screen ---
  contactTitle: 'ติดต่อ',
  contactName: 'ชื่อ',
  contactEmail: 'อีเมล',
  contactMessage: 'ข้อความ',
  contactSend: 'ส่ง',
  contactSending: 'กำลังส่ง…',
  contactCooling: 'รอสักครู่…',
  contactSuccess: 'ส่งแล้ว ✅',
  contactError: 'ผิดพลาด:',
  contactErrorMissing: 'กรุณาใส่อีเมลและข้อความ',
  contactErrorTooLong: 'ยาวสุด 500 ตัวอักษร',
  contactErrorCooldown: 'โปรดรอสักครู่',
  contactErrorGeneric: 'ส่งไม่สำเร็จ โปรดลองอีกครั้ง',
  phContactName: 'ชื่อ',
  phContactEmail: 'อีเมล',
  phContactMessage: 'ข้อความ',

  // --- QR ---
  enlargeQR: 'ขยาย QR',
  shrinkQR: 'ย่อ QR',

  // --- Update / PWA ---
  updateAvailable: 'มีเวอร์ชันใหม่',
} as const;

// Single named export
export const dictionary = { en, th } as const;

// Helpful types (optional but recommended)
export type I18nKey = keyof typeof en;
export function isI18nKey(k: string): k is I18nKey {
  return k in en;
}
