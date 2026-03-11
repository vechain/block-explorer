'use client'

import { ColorMode } from './config'

export const useColorMode = () => {
  // const { resolvedTheme, setTheme } = useTheme()
  // const { colorMode: storeColorMode, setColorMode: setStoreColorMode } = useSettingsStore()

  // // Always default to dark mode - system preference is disabled via enableSystem={false}
  // const colorMode = storeColorMode || resolvedTheme || ColorMode.DARK

  // const setColorMode = (newColorMode: ColorMode) => {
  //   setStoreColorMode(newColorMode)
  //   setTheme(newColorMode)
  // }

  // const toggleColorMode = () => {
  //   const newColorMode = colorMode === ColorMode.DARK ? ColorMode.LIGHT : ColorMode.DARK
  //   setColorMode(newColorMode)
  // }
  return {
    colorMode: ColorMode.DARK,
    setColorMode: (_newColorMode: ColorMode) => {},
    toggleColorMode: () => {},
  }
}
