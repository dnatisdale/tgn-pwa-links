// src/i18n.ts
 export type Lang = 'en' | 'th';

 export const strings: Record<Lang, Record<string, string>> = {
   // … your EN / TH entries …
 };

 // Legacy-friendly helper so callers can do: tr(lang, 'export')
 export function tr(lang: Lang, key: string): string {
   return strings[lang]?.[key] ?? key;
 }

export const t = (l: Lang) => ({
  appTitle:        l === "th" ? "ข่าวประเสริฐภาษาไทย" : "Thai Good News",
  browse:          l === "th" ? "เรียกดู" : "Browse",
  add:             l === "th" ? "เพิ่มลิงก์" : "Add",
  importTitle:     l === "th" ? "นำเข้าข้อมูล" : "Import",
  exportTitle:     l === "th" ? "ส่งออกข้อมูล" : "Export",
  importExport:    l === "th" ? "นำเข้าข้อมูล" : "Import", // nav text for the Import page
  about:           l === "th" ? "เกี่ยวกับ" : "About",

  logout:          l === "th" ? "ออกจากระบบ" : "Log out",
  loginTitle:      l === "th" ? "เข้าสู่ระบบด้วยอีเมล" : "Sign in with Email",
  email:           l === "th" ? "อีเมล" : "Email",
  password:        l === "th" ? "รหัสผ่าน" : "Password",
  signIn:          l === "th" ? "เข้าสู่ระบบ" : "Sign in",
  signUp:          l === "th" ? "สมัครสมาชิก" : "Sign up",

  name:            l === "th" ? "ชื่อเรื่อง" : "Name",
  language:        l === "th" ? "ภาษา" : "Language",
  // Friendlier URL hint (you said you don’t want the strict message here)
  url:             l === "th" ? "ลิงก์" : "URL",
  urlHint:         l === "th" ? "ใส่ URL จะมีหรือไม่มี https:// ก็ได้" : "Enter URL (with or without https://)",
  save:            l === "th" ? "บันทึก" : "Save",

  searchPlaceholder: l === "th" ? "ค้นหาทุกภาษา…" : "Search all languages…",
  size:              l === "th" ? "ขนาดตัวอักษร" : "Text size",
  small:             l === "th" ? "เล็ก" : "Small",
  medium:            l === "th" ? "กลาง" : "Medium",
  large:             l === "th" ? "ใหญ่" : "Large",
  filterAll:         l === "th" ? "ทั้งหมด" : "All",
  filterThai:        l === "th" ? "เฉพาะภาษาไทย" : "Thai only",

  share:          l === "th" ? "แชร์" : "Share",
  emailShare:     l === "th" ? "อีเมล" : "Email",
  fbShare:        l === "th" ? "เฟซบุ๊ก" : "Facebook",
  xShare:         l === "th" ? "เอ็กซ์" : "X / Twitter",
  waShare:        l === "th" ? "วอทส์แอป" : "WhatsApp",
  tgShare:        l === "th" ? "เทเลแกรม" : "Telegram",
  lineShare:      l === "th" ? "ไลน์" : "LINE",
  copyLink:       l === "th" ? "คัดลอกลิงก์" : "Copy link",
  downloadQR:     l === "th" ? "ดาวน์โหลดรูป QR" : "Download QR card",

  empty:          l === "th" ? "ยังไม่มีลิงก์ — กด เพิ่มลิงก์ เพื่อเริ่มต้น" : "No links yet — click Add to create your first one.",
  selectAtLeast:  l === "th" ? "( เลือกอย่างน้อย 1 รายการ )" : "( Select at least one item )",
  select:         l === "th" ? "เลือก" : "Select",
  selectAll:      l === "th" ? "เลือกทั้งหมด" : "Select all",
  clear:          l === "th" ? "ล้างการเลือก" : "Clear",
});
