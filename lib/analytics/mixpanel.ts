'use client'

import mixpanel from 'mixpanel-browser'

const MIXPANEL_TOKEN = 'db1740972d9b4ed9ef53c6e76eb82b72'
const IS_DEV = process.env.NODE_ENV === 'development'

let initialized = false

export function initMixpanel() {
  if (IS_DEV || initialized || typeof window === 'undefined') return

  mixpanel.init(MIXPANEL_TOKEN, {
    api_host: 'https://api-eu.mixpanel.com',
    persistence: 'localStorage',
  })

  initialized = true
}

export function trackPageView(path: string) {
  if (IS_DEV || !initialized) return

  mixpanel.track('Page View', {
    path,
  })
}
