// src/i18n-provider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getLang, setLang as i18nSetLang, onLangChange } from './i18n';
import type { Lang } from './i18n';

type Dictionary = Record<string, string>;
const catalog: Record<Lang, Dictionary> = {
  en: {
    // App / chrome
    appName: 'Thai Good News',
    version: 'Version',
    build: 'Build',
    updateAvailable: 'Update available',
    refresh: 'Refresh',
    close: 'Close',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    done: 'Done',
    loading: 'Loading…',
    error: 'Error',
    success: 'Success',
    tryAgain: 'Try again',

    // Auth
    signin: 'Sign In',
    signout: 'Log Out',
    logout: 'Log Out',
    signup: 'Create Account',
    continueAsGuest: 'Continue as Guest',
    signinWithGoogle: 'Sign in with Google',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    confirmPassword: 'Confirm password',

    // Header / install / language
    install: 'Install',
    installApp: 'Install App',
    addToHomeScreen: 'Add to Home Screen',
    language: 'Language',
    english: 'English',
    thai: 'Thai',

    // Library / data
    home: 'Home',
    library: 'Library',
    links: 'Links',
    url: 'URL',
    title: 'Title',
    description: 'Description',
    languageOfContent: 'Content language',
    category: 'Category',
    tags: 'Tags',
    created: 'Created',
    updated: 'Updated',
    actions: 'Actions',

    // CRUD
    add: 'Add',
    createNew: 'Create new',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    update: 'Update',
    delete: 'Delete',
    remove: 'Remove',
    areYouSure: 'Are you sure?',
    confirm: 'Confirm',

    // Search / filter / sort
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    all: 'All',
    favorites: 'Favorites',
    recent: 'Recent',
    clear: 'Clear',
    apply: 'Apply',

    // Share / QR / copy
    share: 'Share',
    copy: 'Copy',
    copyLink: 'Copy link',
    open: 'Open',
    generateQR: 'Generate QR',
    print: 'Print',
    download: 'Download',
    upload: 'Upload',

    // Import / export
    import: 'Import',
    export: 'Export',
    importCsv: 'Import CSV',
    exportCsv: 'Export CSV',
    importList: 'Import list',
    exportList: 'Export list',

    // Status / connectivity
    online: 'Online',
    offline: 'Offline',
    syncing: 'Syncing…',
    synced: 'Synced',
    failed: 'Failed',

    // Pagination
    page: 'Page',
    of: 'of',
    items: 'items',
    itemsSelected: 'items selected',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',

    // Settings / about
    settings: 'Settings',
    profile: 'Profile',
    help: 'Help',
    about: 'About',
    contact: 'Contact',

    // iOS tip
    iosInstallTip: 'On iPhone/iPad: Share → Add to Home Screen',
  },

  th: {
    // App / chrome
    appName: 'ข่าวดีภาษาไทย',
    version: 'เวอร์ชัน',
    build: 'บิลด์',
    updateAvailable: 'มีอัปเดตใหม่',
    refresh: 'รีเฟรช',
    close: 'ปิด',
    ok: 'ตกลง',
    yes: 'ใช่',
    no: 'ไม่',
    back: 'ย้อนกลับ',
    next: 'ถัดไป',
    previous: 'ก่อนหน้า',
    done: 'เสร็จสิ้น',
    loading: 'กำลังโหลด…',
    error: 'ผิดพลาด',
    success: 'สำเร็จ',
    tryAgain: 'ลองอีกครั้ง',

    // Auth
    signin: 'เข้าสู่ระบบ',
    signout: 'ออกจากระบบ',
    logout: 'ออกจากระบบ',
    signup: 'สร้างบัญชี',
    continueAsGuest: 'ใช้งานต่อโดยไม่เข้าสู่ระบบ',
    signinWithGoogle: 'เข้าสู่ระบบด้วย Google',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    forgotPassword: 'ลืมรหัสผ่าน?',
    confirmPassword: 'ยืนยันรหัสผ่าน',

    // Header / install / language
    install: 'ติดตั้ง',
    installApp: 'ติดตั้งแอป',
    addToHomeScreen: 'เพิ่มไปยังหน้าจอโฮม',
    language: 'ภาษา',
    english: 'อังกฤษ',
    thai: 'ไทย',

    // Library / data
    home: 'หน้าหลัก',
    library: 'คลังข้อมูล',
    links: 'ลิงก์',
    url: 'ลิงก์ (URL)',
    title: 'ชื่อเรื่อง',
    description: 'คำอธิบาย',
    languageOfContent: 'ภาษาของเนื้อหา',
    category: 'หมวดหมู่',
    tags: 'แท็ก',
    created: 'สร้างเมื่อ',
    updated: 'อัปเดตเมื่อ',
    actions: 'การทำงาน',

    // CRUD
    add: 'เพิ่ม',
    createNew: 'สร้างใหม่',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    edit: 'แก้ไข',
    update: 'อัปเดต',
    delete: 'ลบ',
    remove: 'เอาออก',
    areYouSure: 'แน่ใจหรือไม่?',
    confirm: 'ยืนยัน',

    // Search / filter / sort
    search: 'ค้นหา',
    filter: 'ตัวกรอง',
    sort: 'จัดเรียง',
    all: 'ทั้งหมด',
    favorites: 'รายการโปรด',
    recent: 'ล่าสุด',
    clear: 'ล้างค่า',
    apply: 'นำไปใช้',

    // Share / QR / copy
    share: 'แชร์',
    copy: 'คัดลอก',
    copyLink: 'คัดลอกลิงก์',
    open: 'เปิด',
    generateQR: 'สร้างคิวอาร์โค้ด',
    print: 'พิมพ์',
    download: 'ดาวน์โหลด',
    upload: 'อัปโหลด',

    // Import / export
    import: 'นำเข้า',
    export: 'ส่งออก',
    importCsv: 'นำเข้า CSV',
    exportCsv: 'ส่งออก CSV',
    importList: 'นำเข้ารายการ',
    exportList: 'ส่งออกรายการ',

    // Status / connectivity
    online: 'ออนไลน์',
    offline: 'ออฟไลน์',
    syncing: 'กำลังซิงก์…',
    synced: 'ซิงก์แล้ว',
    failed: 'ล้มเหลว',

    // Pagination
    page: 'หน้า',
    of: 'จาก',
    items: 'รายการ',
    itemsSelected: 'เลือกรายการแล้ว',
    selectAll: 'เลือกทั้งหมด',
    deselectAll: 'ยกเลิกการเลือกทั้งหมด',

    // Settings / about
    settings: 'การตั้งค่า',
    profile: 'โปรไฟล์',
    help: 'ช่วยเหลือ',
    about: 'เกี่ยวกับ',
    contact: 'ติดต่อ',

    // iOS tip
    iosInstallTip: 'บน iPhone/iPad: กด แชร์ → เพิ่มไปยังหน้าจอโฮม',
  },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof (typeof catalog)['en'] | string) => string;
};

const I18nCtx = createContext<Ctx | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getLang());

  // Keep React in sync with your core i18n.ts
  useEffect(() => onLangChange((l) => setLangState(l)), []);

  const setLang = React.useCallback((l: Lang) => {
    i18nSetLang(l);
    setLangState(l);
  }, []);

  const t = useMemo(() => {
    return (key: string) => catalog[lang]?.[key] ?? catalog.en[key] ?? key;
  }, [lang]);

  const value: Ctx = { lang, setLang, t };
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
