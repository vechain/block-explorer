export const DEV_MODE_DEFAULTS = {
  soloNodeUrl: 'http://localhost:8669',
  soloIndexerUrl: 'http://localhost:8080',
} as const

// Dev mode (solo network + configurable solo endpoints) is only available in local development.
// Next.js inlines NODE_ENV at build time, so production/preview builds evaluate this to false.
export const IS_DEV_MODE_ALLOWED = process.env.NODE_ENV === 'development'
