'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useLocale } from '@/hooks/useLocale'
import { useSettingsStore } from '@/lib/stores/settings'
import { initMixpanel, trackPageView } from './mixpanel'

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const language = useLocale()
  const network = useSettingsStore(s => s.activeNetwork.name)
  const currency = useSettingsStore(s => s.currency)

  useEffect(() => {
    initMixpanel()
  }, [])

  useEffect(() => {
    trackPageView({ path: pathname, network, language, currency })
  }, [pathname, network, language, currency])

  return children
}
