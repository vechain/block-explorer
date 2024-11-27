import "./App.css"
import { LatestBlocks } from "./components/blocks/LatestBlocks.tsx"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LatestBlocks count={5} />
    </QueryClientProvider>
  )
}

export default App
