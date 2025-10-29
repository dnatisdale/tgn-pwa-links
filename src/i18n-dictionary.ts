// src/i18n-dictionary.ts
// One source of truth for all UI strings. Keys must be UNIQUE.

export const en = {
  appName: 'Thai Good News',
  add: 'Add',
  browse: 'Browse',
  import: 'Import',
  export: 'Export',
  contact: 'Contact',
  about: 'About',
  aboutText: 'Thai Good News — a simple PWA for saving, sharing, and printing QR link cards.',
  install: 'Install',
  logout: 'Log Out',
  signin: 'Sign In',
  signup: 'Sign Up',
  continueAsGuest: 'Continue as Guest',
  email: 'Email',
  password: 'Password',

  // Search / filters
  search: 'Search all languages...',
  all: 'All',
  thai: 'Thai only',

  // Common actions
  save: 'Save',
  saving: 'Saving…',
  saved: 'Saved',
  edit: 'Edit',
  delete: 'Delete',
  close: 'Close',
  refresh: 'Refresh',
  print: 'Print',
  exportCsv: 'Export CSV',
  exportJson: 'Export JSON',

  // List/selection
  select: 'Select',
  selectAll: 'Select all',
  selectAtLeastOne: 'Select at least one item',
  downloadQRCards: 'Download QR cards',

  // Share
  share: 'Share',
  copyLink: 'Copy link',
  urlCopied: 'Link copied!',

  // Fields / validation
  title: 'Title',
  languageOfContent: 'Language',
  url: 'URL',
  invalidUrl: 'URL must be secure (https). You can type it with or without https://',
  mustBeHttps: 'URL must be https (or leave off scheme to auto-https)',

  // Import/Export screens
  chooseFile: 'Choose file',
  file: 'File',
  preview: 'Preview',
  valid: 'valid',
  invalid: 'Invalid',
  ok: 'OK',
  nothingToImport: 'Nothing to import.',
  importComplete: 'Import complete',
  tipExportsFiltered: 'Tip: Exports include only what’s currently in your list.',

  // QR
  enlargeQR: 'Enlarge QR',
  shrinkQR: 'Shrink QR',

  // Update / PWA
  updateAvailable: 'New Version',
} as const;

export const th = {
  appName: 'Thai Good News',
  add: 'เพิ่ม',
  browse: 'เรียกดู',
  import: 'นำเข้า',
  export: 'ส่งออก',
  contact: 'ติดต่อ',
  about: 'เกี่ยวกับ',
  aboutText: 'Thai Good News — แอปสำหรับบันทึก แบ่งปัน และพิมพ์การ์ด QR ของลิงก์ได้อย่างง่ายดาย',
  install: 'ติดตั้ง',
  logout: 'ออกจากระบบ',
  signin: 'เข้าสู่ระบบ',
  signup: 'สมัครสมาชิก',
  continueAsGuest: 'เข้าชมแบบผู้เยี่ยมชม',
  email: 'อีเมล',
  password: 'รหัสผ่าน',

  // Search / filters
  search: 'ค้นหาทุกภาษา...',
  all: 'ทั้งหมด',
  thai: 'เฉพาะภาษาไทย',

  // Common actions
  save: 'บันทึก',
  saving: 'กำลังบันทึก…',
  saved: 'บันทึกแล้ว',
  edit: 'แก้ไข',
  delete: 'ลบ',
  close: 'ปิด',
  refresh: 'รีเฟรช',
  print: 'พิมพ์',
  exportCsv: 'ส่งออก CSV',
  exportJson: 'ส่งออก JSON',

  // List/selection
  select: 'เลือก',
  selectAll: 'เลือกทั้งหมด',
  selectAtLeastOne: 'เลือกอย่างน้อยหนึ่งรายการ',
  downloadQRCards: 'ดาวน์โหลดการ์ด QR',

  // Share
  share: 'แชร์',
  copyLink: 'คัดลอกลิงก์',
  urlCopied: 'คัดลอกลิงก์แล้ว',

  // Fields / validation
  title: 'ชื่อเรื่อง',
  languageOfContent: 'ภาษา',
  url: 'ลิงก์',
  invalidUrl: 'ลิงก์ต้องเป็น https เท่านั้น หรือพิมพ์โดยไม่ต้องใส่ https://',
  mustBeHttps: 'ลิงก์ต้องเป็น https (หรือเว้นไม่ใส่คำนำหน้าเพื่อให้เพิ่ม https อัตโนมัติ)',

  // Import/Export screens
  chooseFile: 'เลือกไฟล์',
  file: 'ไฟล์',
  preview: 'พรีวิว',
  valid: 'ถูกต้อง',
  invalid: 'ไม่ถูกต้อง',
  ok: 'ตกลง',
  nothingToImport: 'ไม่มีข้อมูลสำหรับนำเข้า',
  importComplete: 'นำเข้าสำเร็จ',
  tipExportsFiltered: 'เคล็ดลับ: การส่งออกจะรวมเฉพาะรายการที่อยู่ในรายการของคุณตอนนี้เท่านั้น',

  // QR
  enlargeQR: 'ขยาย QR',
  shrinkQR: 'ย่อ QR',

  // Update / PWA
  updateAvailable: 'มีเวอร์ชันใหม่',
} as const;
