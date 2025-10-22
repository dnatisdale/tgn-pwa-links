// src/types-pwa.d.ts

// 1) vite-plugin-pwa virtual module typing
declare module "virtual:pwa-register" {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
  }
  export function registerSW(
    options?: RegisterSWOptions
  ): (reload?: boolean) => void;
}

// 2) beforeinstallprompt event typing (for Install button)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// 3) globals we set/use in the app
declare global {
  interface Window {
    __deferredPrompt__?: BeforeInstallPromptEvent | null;
    __REFRESH_SW__?: (reload?: boolean) => void;
  }
}

export {};
