/// <reference types="vite/client" />
// vite-env.d.ts
declare module '*.md' {
  const content: string;
  export default content;
}
