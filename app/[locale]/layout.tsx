import '@/app/globals.css'
import { Container, VStack } from '@chakra-ui/react'
import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import { Suspense } from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/navigation/Header'
import { NetworkSearchParamSync } from '@/components/navigation/NetworkSearchParamSync'
import { ChakraProvider } from '@/components/theme/provider'
import { Toaster } from '@/components/ui/toaster'
import type { Locale } from '@/i18n/config'
import { TranslationsProvider } from '@/i18n/provider'
import { QueryClientProvider } from '@/lib/query-client/provider'
import { RuntimeConfigScript } from '@/lib/runtime-config/script'

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

// Force per-request rendering so RuntimeConfigScript reads process.env at runtime,
// not at build time. Without this, a prebuilt standalone server would bake in whatever
// env vars were set when the image was built.
// This covers every route beneath, so no page under it can opt back into ISR.
export const dynamic = 'force-dynamic'

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
        <RuntimeConfigScript />
        <Providers locale={locale}>
          <VStack
            as="main"
            bgImage={{
              base: "url('/bg/Mobile.webp')",
              md: "url('/bg/Desktop.webp')",
            }}
            color="text-primary"
            bgSize="100%"
            bgRepeat="no-repeat"
            backgroundColor="#0B0C10"
            overflowX="hidden"
            justifyContent="space-between"
          >
            <Container
              maxW="1080px"
              display="flex"
              flexDirection="column"
              px={4}
              pt={{ base: 2, md: 10 }}
              pb={10}
              mx="auto"
            >
              <Header />
              {children}
            </Container>
            <Footer />
          </VStack>
        </Providers>
      </body>
    </html>
  )
}

const Providers = ({ children, locale }: { children: React.ReactNode; locale: string }) => {
  return (
    <QueryClientProvider>
      <ChakraProvider>
        <TranslationsProvider locale={locale as Locale}>
          <Suspense fallback={null}>
            <NetworkSearchParamSync />
          </Suspense>
          {children}
          <Toaster />
        </TranslationsProvider>
      </ChakraProvider>
    </QueryClientProvider>
  )
}
