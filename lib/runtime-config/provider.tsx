'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_RUNTIME_CONFIG, RUNTIME_CONFIG_URL, RUNTIME_CONFIG_WINDOW_KEY, runtimeConfigSchema } from './types'

const fetchRuntimeConfig = async () => {
  const response = await fetch(RUNTIME_CONFIG_URL, { cache: 'no-store' })
  if (!response.ok) throw new Error(`${RUNTIME_CONFIG_URL} responded ${response.status}`)
  return runtimeConfigSchema.parse(await response.json())
}

// Gates first paint so no descendant reads a config that has not arrived, and publishes to
// `window` because `getRuntimeConfig()` is called from stores and services that are not React.
export function RuntimeConfigProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      let config = DEFAULT_RUNTIME_CONFIG
      try {
        config = await fetchRuntimeConfig()
      } catch (error) {
        console.error('Falling back to default runtime config:', error)
      }
      Object.assign(window, { [RUNTIME_CONFIG_WINDOW_KEY]: config })
      if (!cancelled) setIsReady(true)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  if (!isReady) return null

  return children
}
