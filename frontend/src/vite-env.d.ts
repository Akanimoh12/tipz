/// <reference types="vite/client" />

declare module '*.json' {
  const value: any;
  export default value;
}

interface ImportMetaEnv {
  readonly VITE_SOMNIA_TESTNET_RPC_URL: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_PINATA_JWT: string;
  readonly VITE_TIPZ_PROFILE_ADDRESS: string;
  readonly VITE_TIPZ_CORE_ADDRESS: string;
  readonly VITE_APP_URL: string;
  readonly SENTRY_AUTH_TOKEN?: string;
  readonly SENTRY_ORG?: string;
  readonly SENTRY_PROJECT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
