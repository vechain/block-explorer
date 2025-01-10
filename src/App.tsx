import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NetworkProvider } from "@/providers/NetworkProvider.tsx"
import Dashboard from "@/pages/Dashboard.tsx"
import BlockDetailsPage from "@/pages/BlockDetailsPage.tsx"
import TransactionDetailsPage from "@/pages/TransactionDetailsPage.tsx"
import ClauseDetailsPage from "@/pages/ClauseDetailsPage.tsx"
import NotFoundPage from "@/pages/NotFoundPage.tsx"
import AccountPage from "@/pages/AccountPage.tsx"
import Navbar from "@/components/navigation/NavBar.tsx"
import { Box } from "@chakra-ui/react"

const queryClient = new QueryClient()

const App = () => {
  return (
    <NetworkProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Box bg="linear-gradient(180deg, #525860 0%, #363A3F 100%)" px={6} py={4}>
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
        </Router>
      </QueryClientProvider>
    </NetworkProvider>
  )
}

export default App
