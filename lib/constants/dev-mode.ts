export const DEV_MODE_DEFAULTS = {
  soloNodeUrl: 'http://localhost:8669',
  soloIndexerUrl: 'http://localhost:8080',
} as const

// Dev mode (solo network + configurable solo endpoints) is opt-in.
// `pnpm dev` enables it automatically; other builds must be built with NEXT_PUBLIC_ALLOW_DEV_MODE=true.
// Next.js inlines both values at build time, so prod/preview images built without the flag exclude dev mode.
export const IS_DEV_MODE_ALLOWED =
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ALLOW_DEV_MODE === 'true'
