'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { initMixpanel, trackPageView } from './mixpanel'

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    initMixpanel()
  }, [])

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  return children
}
