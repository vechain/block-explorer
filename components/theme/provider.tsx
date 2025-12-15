'use client'

import { ChakraProvider as ChakraProviderBase } from '@chakra-ui/react'
import { ThemeProvider } from 'next-themes'
import { ColorMode, system } from './config'

export const ChakraProvider = ({ children }: React.PropsWithChildren) => {
  return (
    <ChakraProviderBase value={system}>
      <ThemeProvider attribute="class" defaultTheme={ColorMode.DARK} enableSystem={false} disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </ChakraProviderBase>
  )
}
