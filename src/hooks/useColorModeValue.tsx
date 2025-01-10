import { useColorMode } from "./useColorMode"

export const useColorModeValue = <T,>(light: T, dark: T) => {
  const { colorMode } = useColorMode()
  return colorMode === "light" ? light : dark
}
