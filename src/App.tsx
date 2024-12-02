import { LatestBlocks } from "./components/blocks/LatestBlocks.tsx"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NetworkProvider } from "@/providers/NetworkProvider.tsx"
import NetworkSwitcher from "@/components/network/NetworkSwitcher.tsx"
import { ColorModeButton } from "@/components/ui/ColorMode.tsx"

const queryClient = new QueryClient()

function App() {
  return (
    <NetworkProvider>
      <QueryClientProvider client={queryClient}>
        <NetworkSwitcher />
        <ColorModeButton/>
        <LatestBlocks count={5} />

      </QueryClientProvider>
    </NetworkProvider>
  )
}

export default App
