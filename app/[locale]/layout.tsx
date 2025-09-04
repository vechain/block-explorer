import { Box, Container, Flex } from '@chakra-ui/react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navigation/NavBar'
import { ChakraProvider } from '@/components/theme/provider'
import type { Locale } from '@/i18n/config'
import { TranslationsProvider } from '@/i18n/provider'
import { QueryClientProvider } from '@/lib/query-client/provider'
import { ThorClientProvider } from '@/services/thor/thor-client'
import { PrereleaseBanner } from './components/PrereleaseBanner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'VeChain Explorer',
  description: 'VeChain Explorer',
  icons: { icon: '/vechain.svg' },
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers locale={locale}>
          <Box h="100vh">
            <PrereleaseBanner />
            <Container maxWidth="1440px" display="flex" flexDirection="column" p={10}>
              <Navbar />
              <Flex mt={10} direction="column" flex={1}>
                {children}
              </Flex>
            </Container>
          </Box>
        </Providers>
      </body>
    </html>
  )
}

const Providers = ({ children, locale }: { children: React.ReactNode; locale: string }) => {
  return (
    <QueryClientProvider>
      <ThorClientProvider>
        <ChakraProvider>
          <TranslationsProvider locale={locale as Locale}>{children}</TranslationsProvider>
        </ChakraProvider>
      </ThorClientProvider>
    </QueryClientProvider>
  )
}
