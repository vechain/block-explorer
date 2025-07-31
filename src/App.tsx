import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThorClientProvider } from "@/services/thor/thor-client"
import { DashboardPage } from "@/pages/dashboard/page"
import { BlockPage } from "@/pages/block/page.tsx"
import { BlockTransactionsPage } from "@/pages/block/transactions/page"
import { TransactionPage } from "@/pages/transaction/page"
import { TransactionClausesPage } from "@/pages/transaction/clauses/page"
import { ClauseDetailsPage } from "@/pages/clause/page"
import { NotFoundPage } from "@/pages/NotFoundPage.tsx"
import { AddressPage } from "@/pages/address/page.tsx"
import { Navbar } from "@/components/navigation/NavBar.tsx"
import { Box, Container, Flex } from "@chakra-ui/react"
import { UiProvider } from "@/components/ui/provider"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ErrorPage } from "./pages/ErrorPage"
import { ErrorBoundary } from "./components/ui/ErrorBoundary"

export const App = () => {
  return (
    <Providers>
      <Router />
    </Providers>
  )
}

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

const Providers = ({ children }: React.PropsWithChildren) => {
  return (
    <ThorClientProvider>
      <QueryClientProvider client={queryClient}>
        <UiProvider>{children}</UiProvider>

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
          <Route path="/transaction/:transactionId/clauses" element={<TransactionClausesPage />} />
          <Route path="/transaction/:transactionId/clause/:clauseIndex" element={<ClauseDetailsPage />} />
          <Route path="/address/:address" element={<AddressPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

const Layout = () => {
  return (
    <Box h="100vh">
      <ErrorBoundary FallbackComponent={ErrorPage}>
        <Container maxWidth="1440px" display="flex" flexDirection="column" p={10}>
          <Navbar />
          <Flex mt={10} direction="column" flex={1}>
            <Outlet />
          </Flex>
        </Container>
      </ErrorBoundary>
    </Box>
  )
}
