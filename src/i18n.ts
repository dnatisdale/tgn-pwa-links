// src/i18n.ts
export type Lang = "en" | "th";

export type Strings = {
  appTitle: string;
  browse: string;
  add: string;
  importExport: string; // used for the nav label only
  importLabel: string;  // page title for Import
  exportLabel: string;  // page title for Export
  logout: string;

  // Auth
  loginTitle: string;
  email: string;
  password: string;
  signIn: string;
  signUp: string;

  // Add / fields
  name: string;
  language: string;
  url: string;            // label text for URL field
  save: string;

  // Search/filter
  searchPlaceholder: string;
  filterAll: string;
  filterThai: string;

  // Sharing
  share: string;
  emailShare: string;
  fbShare: string;
  xShare: string;
  waShare: string;
  copyLink: string;

  // Import/Export actions
  importJSON: string;
  importCSV: string;
  exportJSON: string;

  // Empty state
  empty: string;

  // Small UI bits
  selectAtLeastOneInline: string; // "( Select at least one item )"
  selectAtLeastOnePlain: string;  // "Select at least one item"
};

export const t = (l: Lang): Strings => ({
  appTitle: l === "th" ? "ข่าวประเสริฐภาษาไทย" : "Thai Good News",
  browse: l === "th" ? "เรียกดู" : "Browse",
  add: l === "th" ? "เพิ่มลิงก์" : "Add",
  importExport: l === "th" ? "นำเข้า / ส่งออก" : "Import / Export",
  importLabel: l === "th" ? "นำเข้า" : "Import",
  exportLabel: l === "th" ? "ส่งออก" : "Export",
  logout: l === "th" ? "ออกจากระบบ" : "Log out",

  loginTitle: l === "th" ? "เข้าสู่ระบบด้วยอีเมล" : "Sign in with Email",
  email: l === "th" ? "อีเมล" : "Email",
  password: l === "th" ? "รหัสผ่าน" : "Password",
  signIn: l === "th" ? "เข้าสู่ระบบ" : "Sign in",
  signUp: l === "th" ? "สมัครสมาชิก" : "Sign up",

  name: l === "th" ? "ชื่อเรื่อง" : "Name",
  language: l === "th" ? "ภาษา" : "Language",
  // Per your latest wording: “URL with or without https:// is fine”
  url: l === "th" ? "ลิงก์ (จะมีหรือไม่มีก็ได้ https://)" : "URL (with or without https://)",
  save: l === "th" ? "บันทึก" : "Save",

  searchPlaceholder: l === "th" ? "ค้นหาทุกภาษา…" : "Search all languages…",
  filterAll: l === "th" ? "ทั้งหมด" : "All",
  filterThai: l === "th" ? "เฉพาะภาษาไทย" : "Thai only",

  share: l === "th" ? "แชร์" : "Share",
  emailShare: l === "th" ? "อีเมล" : "Email",
  fbShare: l === "th" ? "เฟซบุ๊ก" : "Facebook",
  xShare: l === "th" ? "เอ็กซ์" : "X / Twitter",
  waShare: l === "th" ? "วอทส์แอป" : "WhatsApp",
  copyLink: l === "th" ? "คัดลอกลิงก์" : "Copy link",

  importJSON: l === "th" ? "นำเข้า JSON" : "Import JSON",
  importCSV: l === "th" ? "นำเข้า CSV" : "Import CSV",
  exportJSON: l === "th" ? "ส่งออก JSON" : "Export JSON",

  empty:
    l === "th"
      ? "ยังไม่มีลิงก์ — กด เพิ่มลิงก์ เพื่อเริ่มต้น"
      : "No links yet — click Add to create your first one.",

  selectAtLeastOneInline: l === "th" ? "( เลือกรายการอย่างน้อยหนึ่งรายการ )" : "( Select at least one item )",
  selectAtLeastOnePlain: l === "th" ? "เลือกรายการอย่างน้อยหนึ่งรายการ" : "Select at least one item",
});
