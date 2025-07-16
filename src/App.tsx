import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThorClientProvider } from "@/context/ThorClientProvider"
import { DashboardPage } from "@/pages/dashboard/page"
import { BlockPage } from "@/pages/block/page.tsx"
import { BlockTransactionsPage } from "@/pages/block/transactions/page"
import { TransactionPage } from "@/pages/transaction/page"
import { ClauseDetailsPage } from "@/pages/ClauseDetailsPage.tsx"
import { NotFoundPage } from "@/pages/NotFoundPage.tsx"
import { AccountPage } from "@/pages/AccountPage.tsx"
import { Navbar } from "@/components/navigation/NavBar.tsx"
import { Container, Flex, ChakraProvider } from "@chakra-ui/react"
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
          <Route path="/block/:blockId" element={<BlockPage />} />
          <Route path="/block/:blockId/transactions" element={<BlockTransactionsPage />} />
          <Route path="/transaction/:transactionId" element={<TransactionPage />} />
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
    <Container maxWidth="1440px" h="100vh" display="flex" flexDirection="column" p={10}>
      <Navbar />
      <Flex mt={10} direction="column" flex={1}>
        <Outlet />
      </Flex>
    </Container>
  )
}
