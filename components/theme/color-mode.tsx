'use client'

import type { IconButtonProps } from '@chakra-ui/react'
import { IconButton } from '@chakra-ui/react'
import { useTheme } from 'next-themes'
import { forwardRef } from 'react'
import { LuMoon, LuSun } from 'react-icons/lu'
import { useSettingsStore } from '@/lib/stores/settings'
import { ColorMode } from './config'

const useColorMode = () => {
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

export const ColorModeButton = forwardRef<HTMLButtonElement, Omit<IconButtonProps, 'aria-label'>>((props, ref) => {
  const { toggleColorMode, colorMode } = useColorMode()

  return (
    <IconButton
      onClick={toggleColorMode}
      variant="ghost"
      aria-label="Toggle color mode"
      size="md"
      ref={ref}
      bg={{ base: 'primary.200', _dark: 'primary.800' }}
      {...props}
      css={{
        _icon: {
          width: '5',
          height: '5',
          color: { base: 'primary.800', _dark: 'primary.200' },
        },
      }}>
      {colorMode === 'dark' ? <LuMoon /> : <LuSun />}
    </IconButton>
  )
})
