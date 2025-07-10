import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NetworkProvider } from "@/providers/NetworkProvider"
import { ThorClientProvider } from "@/context/ThorClientProvider"
import Dashboard from "@/pages/Dashboard.tsx"
import BlockDetailsPage from "@/pages/BlockDetailsPage.tsx"
import { TransactionDetailsPage } from "@/pages/TransactionDetailsPage.tsx"
import { ClauseDetailsPage } from "@/pages/ClauseDetailsPage.tsx"
import NotFoundPage from "@/pages/NotFoundPage.tsx"
import AccountPage from "@/pages/AccountPage.tsx"
import Navbar from "@/components/navigation/NavBar.tsx"
import { Box } from "@chakra-ui/react"

import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeProvider } from "@/components/ui/ColorMode.tsx"
import { config } from "@/components/ui/Theme.tsx"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export default function App() {
  return (
    <Providers>
      <Router />
    </Providers>
  )
}

const queryClient = new QueryClient()

function Providers({ children }: React.PropsWithChildren) {
  return (
    <ThorClientProvider>
      <NetworkProvider>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider value={config}>
            <ColorModeProvider>{children}</ColorModeProvider>
          </ChakraProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </NetworkProvider>
    </ThorClientProvider>
  )
}

function Router() {
  return (
    <BrowserRouter>
      <Box bg="linear-gradient(180deg, #525860 0%, #363A3F 100%)" px={6} height={"252px"} py={4}>
        <Navbar />
      </Box>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/block/:blockId" element={<BlockDetailsPage />} />
        <Route path="/transaction/:transactionId" element={<TransactionDetailsPage />} />
        <Route path="/transaction/:transactionId/clause/:clauseIndex" element={<ClauseDetailsPage />} />
        <Route path="/account/:address" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
