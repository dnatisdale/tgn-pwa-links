// src/i18n.ts
export type Lang = "en" | "th";
export const t = (l: Lang) => ({ /* includes loginTitle, email, password, signIn, signUp, … */ });

export const strings = {
  en: {
    appTitle: "Thai Good News",
    browse: "Browse",
    add: "Add",
    import: "Import",
    export: "Export",
    about: "About",
    installPwa: "Install PWA",
    share: "Share",
    signIn: "Sign in",
    continueGuest: "Continue as guest",
    saveSignIn: "Save / Sign in",
    name: "Name",
    language: "Language",
    url: "URL",
    edit: "Edit",
    delete: "Delete",
    print: "Print",
    sharePwa: "Share PWA",
    newVersion: "New Version Available",
    refresh: "Refresh",
    skip: "Skip",
    tipInvalid:
      "Tip: if URL (https) is empty, we rejected it (http or invalid). Fix your file and re-import."
  },
  th: {
    appTitle: "ข่าวดีไทย",
    browse: "เรียกดู",
    add: "เพิ่ม",
    import: "นำเข้า",
    export: "ส่งออก",
    about: "เกี่ยวกับ",
    installPwa: "ติดตั้ง PWA",
    share: "แชร์",
    signIn: "ลงชื่อเข้าใช้",
    continueGuest: "เข้าใช้งานแบบผู้เยี่ยมชม",
    saveSignIn: "บันทึก / ลงชื่อเข้าใช้",
    name: "ชื่อ",
    language: "ภาษา",
    url: "ลิงก์",
    edit: "แก้ไข",
    delete: "ลบ",
    print: "พิมพ์",
    sharePwa: "แชร์ PWA",
    newVersion: "มีเวอร์ชันใหม่",
    refresh: "รีเฟรช",
    skip: "ข้าม",
    tipInvalid:
      "เคล็ดลับ: ถ้า URL (https) ว่าง เราปฏิเสธแล้ว (เป็น http หรือไม่ถูกต้อง) โปรดแก้ไฟล์แล้วนำเข้าใหม่"
  }
} as const;

export type I18nKey = keyof typeof strings["en"];
export function tr(lang: Lang, key: I18nKey): string {
  return strings[lang][key];
}
// compatibility alias so old code `import { t }` still works
export const t = tr;
