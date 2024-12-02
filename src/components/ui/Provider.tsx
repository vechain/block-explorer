"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeProvider } from "./ColorMode.tsx"
import { config } from "@/components/ui/Theme.tsx"

export function Provider(props: React.PropsWithChildren) {
  return (
    <ChakraProvider value={config}>
      <ColorModeProvider>{props.children}</ColorModeProvider>
    </ChakraProvider>
  )
}
