interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    __deferredPrompt__?: BeforeInstallPromptEvent;
    __REFRESH_SW__?: () => void;
  }
}

export {};

