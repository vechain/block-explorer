"use client"

import type { IconButtonProps } from "@chakra-ui/react"
import { IconButton } from "@chakra-ui/react"
import { forwardRef } from "react"
import { LuMoon, LuSun } from "react-icons/lu"
import { ThemeProvider, ThemeProviderProps, useTheme } from "next-themes"
import { useSettingsStore } from "@/stores/settings"

export enum ColorMode {
  LIGHT = "light",
  DARK = "dark",
}

interface UseColorModeReturn {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  toggleColorMode: () => void
}

export const useColorMode = (): UseColorModeReturn => {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme()
  const { colorMode: storeColorMode, setColorMode: setStoreColorMode } = useSettingsStore()

  const colorMode: ColorMode = storeColorMode || forcedTheme || resolvedTheme

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

export const useColorModeValue = <T,>(light: T, dark: T) => {
  const { colorMode } = useColorMode()
  return colorMode === "dark" ? dark : light
}

type ColorModeButtonProps = Omit<IconButtonProps, "aria-label">

const ColorModeIcon = () => {
  const { colorMode } = useColorMode()
  return colorMode === "dark" ? <LuMoon /> : <LuSun />
}

export const ColorModeButton = forwardRef<HTMLButtonElement, ColorModeButtonProps>((props, ref) => {
  const { toggleColorMode } = useColorMode()
  return (
    <IconButton
      onClick={toggleColorMode}
      variant="ghost"
      aria-label="Toggle color mode"
      size="md"
      ref={ref}
      bg={{ base: "primary.200", _dark: "primary.800" }}
      {...props}
      css={{ _icon: { width: "5", height: "5", color: { base: "primary.800", _dark: "primary.200" } } }}>
      <ColorModeIcon />
    </IconButton>
  )
})

export const ColorModeProvider = (props: ThemeProviderProps) => {
  return <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
}
