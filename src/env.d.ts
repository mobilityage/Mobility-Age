// src/env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACCESS_CODE: string;
  readonly VITE_API_KEY?: string;
  // any other env variables you might need later
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
