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
  cancel: 'Cancel',

  // --- Authentication ---
  signIn: 'Sign In',
  signUp: 'Sign Up',
  logout: 'Log Out',
  continueAsGuest: 'Continue as Guest',
  email: 'Email',
  password: 'Password',
  logoutFailed: 'Could not log out. Please try again.',
  pleaseSignIn: 'Please sign in to use the Thai Good News app.',

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
  languages: 'Languages',
  searchLanguage: 'Search language…',
  noLanguagesMatch: 'No languages match.',

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

  // --- ADD Screen ---
  phAddUrl: 'Paste or type your link here',
  phAddTitle: 'Give it a short title (optional)',
  phAddTags: 'Add keywords separated by spaces or commas',
  addLink: 'Add link',
  addLinkSaved: 'Saved ✅',
  saveFailed: 'Save failed. Please try again.',
  invalidUrl:
    'Please enter a secure web address. (This app accepts https links only to protect your information.)',
  clear: 'Clear',
  tipEnterToSave: 'Tip: Press Enter in any field to save.',

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
  cancel: 'ยกเลิก',

  // --- Authentication ---
  signIn: 'เข้าสู่ระบบ',
  signUp: 'สมัครสมาชิก',
  logout: 'ออกจากระบบ',
  continueAsGuest: 'เข้าชมแบบผู้เยี่ยมชม',
  email: 'อีเมล',
  password: 'รหัสผ่าน',
  logoutFailed: 'ออกจากระบบไม่สำเร็จ โปรดลองอีกครั้ง',
  pleaseSignIn: 'กรุณาเข้าสู่ระบบเพื่อใช้งานแอป Thai Good News',

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
  languages: 'ภาษา',
  searchLanguage: 'ค้นหาภาษา…',
  noLanguagesMatch: 'ไม่พบภาษาที่ค้นหา',

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

  // --- ADD Screen ---
  phAddUrl: 'วางหรือลิงก์ของคุณที่นี่',
  phAddTitle: 'ตั้งชื่อสั้นๆ เพื่อจำง่าย (ไม่ใส่ก็ได้)',
  phAddTags: 'เพิ่มคำค้น คั่นด้วยช่องว่างหรือจุลภาค',
  addLink: 'บันทึกลิงก์',
  addLinkSaved: 'บันทึกแล้ว ✅',
  saveFailed: 'บันทึกล้มเหลว โปรดลองอีกครั้ง',
  invalidUrl:
    'กรุณาใส่ที่อยู่เว็บไซต์ที่ปลอดภัย (แอปนี้รองรับเฉพาะลิงก์แบบ https เพื่อปกป้องข้อมูลของคุณ)',
  clear: 'ล้างข้อมูล',
  tipEnterToSave: 'ทิป: กด Enter ในช่องใดก็ได้เพื่อบันทึก',

  // --- QR ---
  enlargeQR: 'ขยาย QR',
  shrinkQR: 'ย่อ QR',

  // --- Update / PWA ---
  updateAvailable: 'มีเวอร์ชันใหม่',
} as const;

// Single named export
export const dictionary = { en, th } as const;
