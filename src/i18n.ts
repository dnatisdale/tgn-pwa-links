// src/i18n.ts
export type Lang = "en" | "th";

export const t = (l: Lang) => ({
  // App / nav
  appTitle: l === "th" ? "ข่าวประเสริฐภาษาไทย" : "Thai Good News",
  browse: l === "th" ? "เรียกดู" : "Browse",
  add: l === "th" ? "เพิ่มลิงก์" : "Add",
  // NOTE: previously "Import / Export" — now just "Import"
  importExport: l === "th" ? "นำเข้า" : "Import",
  // Optional separate export title (use if you show a dedicated Export page)
  exportTitle: l === "th" ? "ส่งออก" : "Export",

  // Auth
  logout: l === "th" ? "ออกจากระบบ" : "Log out",
  loginTitle: l === "th" ? "เข้าสู่ระบบด้วยอีเมล" : "Sign in with Email",
  email: l === "th" ? "อีเมล" : "Email",
  password: l === "th" ? "รหัสผ่าน" : "Password",
  signIn: l === "th" ? "เข้าสู่ระบบ" : "Sign in",
  signUp: l === "th" ? "สมัครสมาชิก" : "Sign up",

  // Add form
  name: l === "th" ? "ชื่อเรื่อง" : "Name",
  language: l === "th" ? "ภาษา" : "Language",
  // URL label — https is NOT required per your latest request
  url: l === "th" ? "ลิงก์ (ไม่จำเป็นต้องมี https://)" : "URL (https optional)",
  save: l === "th" ? "บันทึก" : "Save",

  // Search / filters
  searchPlaceholder: l === "th" ? "ค้นหาทุกภาษา…" : "Search all languages…",
  size: l === "th" ? "ขนาดตัวอักษร" : "Text size",
  small: l === "th" ? "เล็ก" : "Small",
  medium: l === "th" ? "กลาง" : "Medium",
  large: l === "th" ? "ใหญ่" : "Large",
  filterAll: l === "th" ? "ทั้งหมด" : "All",
  filterThai: l === "th" ? "เฉพาะภาษาไทย" : "Thai only",

  // Sharing
  share: l === "th" ? "แชร์" : "Share",
  emailShare: l === "th" ? "อีเมล" : "Email",
  fbShare: l === "th" ? "เฟซบุ๊ก" : "Facebook",
  xShare: l === "th" ? "เอ็กซ์" : "X / Twitter",
  waShare: l === "th" ? "วอทส์แอป" : "WhatsApp",
  copyLink: l === "th" ? "คัดลอกลิงก์" : "Copy link",

  // Import / Export actions (keep for buttons/menus)
  importJSON: l === "th" ? "นำเข้า JSON" : "Import JSON",
  importCSV: l === "th" ? "นำเข้า CSV" : "Import CSV",
  exportJSON: l === "th" ? "ส่งออก JSON" : "Export JSON",

  // Empty state
  empty:
    l === "th"
      ? "ยังไม่มีลิงก์ — กด เพิ่มลิงก์ เพื่อเริ่มต้น"
      : "No links yet — click Add to create your first one.",

  // ---- Optional extras (use if you want; safe to ignore) ----
  sharePWA: l === "th" ? "แชร์แอป" : "Share PWA",
  install: l === "th" ? "ติดตั้ง" : "Install",
  selectAtLeastOne:
    l === "th" ? "( เลือกอย่างน้อยหนึ่งรายการ )" : "(Select at least one item)",
  downloadQrCards:
    l === "th" ? "ดาวน์โหลดการ์ด QR" : "Download QR cards",
  importFormatsNote:
    l === "th" ? "(CSV / TSV / JSON)" : "(CSV / TSV / JSON)",
  addButton: l === "th" ? "เพิ่ม" : "Add",
});
