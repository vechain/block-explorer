'use client'

import { useTheme } from 'next-themes'
import { useSettingsStore } from '@/lib/stores/settings'
import { ColorMode } from './config'

export const useColorMode = () => {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme()
  const { colorMode: storeColorMode, setColorMode: setStoreColorMode } = useSettingsStore()

  const colorMode = storeColorMode || forcedTheme || resolvedTheme

  const setColorMode = (newColorMode: ColorMode) => {
    setStoreColorMode(newColorMode)
    setTheme(newColorMode)
  }

  const toggleColorMode = () => {
    const newColorMode = colorMode === ColorMode.DARK ? ColorMode.LIGHT : ColorMode.DARK
    setColorMode(newColorMode)
  }

  return {
    colorMode,
    setColorMode,
    toggleColorMode,
  }
}
