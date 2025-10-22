/// <reference types="vite/client" />

declare const __APP_VERSION__: string | undefined;
declare const __BUILD_PRETTY__: string | undefined;
declare const __BUILD_PRETTY__: string | undefined;

declare module "virtual:pwa-register" {
  export function registerSW(options?: {
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
  }): (reloadPage?: boolean) => void;
}

