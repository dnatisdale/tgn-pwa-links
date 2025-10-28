// global.d.ts — single source for build-time constants injected by Vite
declare const __APP_VERSION__: string;
declare const __BUILD_TIME_PST__: string;

// Optional extras (declared so TS won't complain if you reference them)
declare const __BUILD_ID__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_TIME__: string;
declare const __BUILD_PRETTY__: string;
