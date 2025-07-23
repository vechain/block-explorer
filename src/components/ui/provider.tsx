import { ChakraProvider as ChakraProviderBase } from "@chakra-ui/react"
import { system } from "./theme/theme"
import { ColorModeProvider } from "./theme/color-mode"

export const UiProvider = ({ children }: React.PropsWithChildren) => {
  return (
    <ChakraProvider>
      <ColorModeProvider>{children}</ColorModeProvider>
    </ChakraProvider>
  )
}

export const ChakraProvider = ({ children }: React.PropsWithChildren) => {
  return <ChakraProviderBase value={system}>{children}</ChakraProviderBase>
}
