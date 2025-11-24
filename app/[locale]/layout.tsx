import { Box, Container } from '@chakra-ui/react'
import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/navigation/Header'
import { ChakraProvider } from '@/components/theme/provider'
import type { Locale } from '@/i18n/config'
import { TranslationsProvider } from '@/i18n/provider'
import { QueryClientProvider } from '@/lib/query-client/provider'

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | VeChain Explorer',
    default: 'VeChain Explorer',
  },
  description: "VeChain's block explorer",
  icons: { icon: '/vechain-logo.png' },
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
      <body className={rubik.variable}>
        <Providers locale={locale}>
          <Box
            as="main"
            minH="100vh"
            bgImage={{
              base: "url('/bg/Mobile.jpg')",
              md: "url('/bg/Desktop.jpg')",
            }}
            color="text-primary"
            bgSize="100%"
            bgRepeat="no-repeat"
            overflowX="hidden"
            // TODO: Update background color with theme once implemented
            backgroundColor="#0B0C10">
            <Container maxW="1080px" display="flex" flexDirection="column" px={4} pt={{ base: 2, md: 10 }} pb={10}>
              <Header />
              {children}
              <Footer />
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
