import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, Mock } from "vitest"
import { ChakraProvider } from "@chakra-ui/react"
import { TransactionsPerSecond } from "@/components/transactions/TransactionsPerSecond"
import { useLatestBlocks } from "@/hooks/blocks/useLatestBlocks"
import { config } from "@/components/ui/Theme.tsx"
import "@testing-library/jest-dom"

vi.mock("@/hooks/blocks/useLatestBlocks")

describe("TransactionsPerSecond", () => {
  it("renders the correct transactions per second", () => {
    const mockBlocks = [
      { timestamp: 100, transactions: [{}, {}, {}] },
      { timestamp: 90, transactions: [{}, {}] },
      { timestamp: 80, transactions: [{}] },
    ]
    ;(useLatestBlocks as Mock).mockReturnValue({ blocks: mockBlocks })

    render(
      <ChakraProvider value={config}>
        <TransactionsPerSecond numBlocks={2} />
      </ChakraProvider>,
    )

    const transactionsPerSec = (3 + 2) / (100 - 80)
    expect(screen.getByText(transactionsPerSec.toLocaleString())).toBeInTheDocument()
    expect(screen.getByText("Last 2 blocks")).toBeInTheDocument()
  })

  it("renders 0 transactions per second if not enough blocks", () => {
    const mockBlocks = [{ timestamp: 100, transactions: [{}, {}, {}] }]
    ;(useLatestBlocks as Mock).mockReturnValue({ blocks: mockBlocks })

    render(
      <ChakraProvider value={config}>
        <TransactionsPerSecond numBlocks={3} />
      </ChakraProvider>,
    )

    expect(screen.getByText("0")).toBeInTheDocument()
    expect(screen.getByText("Last 3 blocks")).toBeInTheDocument()
  })
})
