import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThorClientProvider } from "@/context/ThorClientProvider"
import { DashboardPage } from "@/pages/dashboard"
import { BlockDetailsPage } from "@/pages/BlockDetailsPage.tsx"
import { TransactionDetailsPage } from "@/pages/TransactionDetailsPage.tsx"
import { ClauseDetailsPage } from "@/pages/ClauseDetailsPage.tsx"
import { NotFoundPage } from "@/pages/NotFoundPage.tsx"
import { AccountPage } from "@/pages/AccountPage.tsx"
import { Navbar } from "@/components/navigation/NavBar.tsx"
import { Box } from "@chakra-ui/react"

import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeProvider } from "@/components/ui/ColorMode.tsx"
import { config } from "@/components/ui/Theme.tsx"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export const App = () => {
  return (
    <Providers>
      <Router />
    </Providers>
  )
}

const queryClient = new QueryClient()

const Providers = ({ children }: React.PropsWithChildren) => {
  return (
    <ThorClientProvider>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={config}>
          <ColorModeProvider>{children}</ColorModeProvider>
        </ChakraProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThorClientProvider>
  )
}

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/block/:blockId" element={<BlockDetailsPage />} />
          <Route path="/transaction/:transactionId" element={<TransactionDetailsPage />} />
          <Route path="/transaction/:transactionId/clause/:clauseIndex" element={<ClauseDetailsPage />} />
          <Route path="/account/:address" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

const Layout = () => {
  return (
    <Box px={10} maxWidth="1440px" mx="auto" h="100vh">
      <Navbar />
      <Outlet />
    </Box>
  )
}
