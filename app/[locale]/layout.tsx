import { Box, Container, Flex } from '@chakra-ui/react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navigation/NavBar'
import { ChakraProvider } from '@/components/theme/provider'
import { BackgroundWrapper } from '@/components/BackgroundWrapper'
import type { Locale } from '@/i18n/config'
import { TranslationsProvider } from '@/i18n/provider'
import { QueryClientProvider } from '@/lib/query-client/provider'
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
    <html
      lang={locale}
      suppressHydrationWarning
      style={{
        margin: 0,
        padding: 0,
        height: '100%',
        width: '100%',
      }}
    >
      <body
        className={inter.variable}
        style={{
          margin: 0,
          padding: 0,
          backgroundImage: 'url(/bg/Mobile.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
          minHeight: '100vh',
          minWidth: '100vw',
          height: 'auto',
          width: '100%',
        }}
      >
        <BackgroundWrapper />
        <Providers locale={locale}>
          <Box
            minH="100vh"
            minW="100vw"
            position="relative"
            w="100%"
            h="auto"
          >
            <PrereleaseBanner />
            <Container
              maxWidth="1440px"
              display="flex"
              flexDirection="column"
              p={{ base: 4, md: 10 }}
              w="100%"
            >
              <Navbar />
              <Flex mt={{ base: 4, md: 10 }} direction="column" flex={1}>
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
      <ChakraProvider>
        <TranslationsProvider locale={locale as Locale}>{children}</TranslationsProvider>
      </ChakraProvider>
    </QueryClientProvider>
  )
}
