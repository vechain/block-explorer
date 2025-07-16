"use client"

import { useColorMode } from "@/hooks/useColorMode"
import type { IconButtonProps } from "@chakra-ui/react"
import { IconButton } from "@chakra-ui/react"
import { ThemeProvider, ThemeProviderProps } from "next-themes"
import { forwardRef } from "react"
import { LuMoon, LuSun } from "react-icons/lu"

export const ColorModeProvider = (props: ThemeProviderProps) => {
  return <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
}

const ColorModeIcon = () => {
  const { colorMode } = useColorMode()
  return colorMode === "light" ? <LuSun /> : <LuMoon color="black" />
}

type ColorModeButtonProps = Omit<IconButtonProps, "aria-label">

export const ColorModeButton = forwardRef<HTMLButtonElement, ColorModeButtonProps>(
  function ColorModeButton(props, ref) {
    const { toggleColorMode } = useColorMode()
    return (
      <IconButton
        onClick={toggleColorMode}
        variant="ghost"
        bg={"grey.300"}
        aria-label="Toggle color mode"
        size="md"
        ref={ref}
        {...props}
        css={{
          _icon: {
            width: "5",
            height: "5",
          },
        }}>
        <ColorModeIcon />
      </IconButton>
    )
  },
)
