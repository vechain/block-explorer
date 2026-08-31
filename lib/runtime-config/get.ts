import { DEFAULT_RUNTIME_CONFIG, RUNTIME_CONFIG_WINDOW_KEY, type RuntimeConfig } from './types'

/** What <RuntimeConfigProvider> fetched. A server render has none, so nothing bakes into the HTML. */
export const getRuntimeConfig = (): RuntimeConfig => {
  if (typeof window === 'undefined') return DEFAULT_RUNTIME_CONFIG

  const fromWindow = (window as unknown as Record<string, RuntimeConfig | undefined>)[RUNTIME_CONFIG_WINDOW_KEY]
  return fromWindow ?? DEFAULT_RUNTIME_CONFIG
}
