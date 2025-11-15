/// <reference types="vite/client" />
// vite-env.d.ts
declare module '*.md' {
  const content: string;
  export default content;
}

// Global constants injected by Vite
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
