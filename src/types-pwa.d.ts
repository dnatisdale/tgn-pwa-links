// types-pwa.d.ts — shared PWA-specific DOM events/types

// "beforeinstallprompt" event (Chromium)
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
