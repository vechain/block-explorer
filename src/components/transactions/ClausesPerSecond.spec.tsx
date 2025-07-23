import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, Mock } from "vitest"
import { ClausesPerSecond } from "@/components/transactions/ClausesPerSecond"
import { useLatestBlocks } from "@/hooks/thor/useLatestBlocks"
import { ChakraProvider } from "@/components/ui/provider"
import "@testing-library/jest-dom"

vi.mock("@/hooks/thor/useLatestBlocks")

describe("ClausesPerSecond", () => {
  it("renders the correct transactions per second", () => {
    const mockBlocks = [
      { timestamp: 100, transactions: [{ clauses: [{}, {}] }, { clauses: [{}] }, { clauses: [{}, {}] }] },
      { timestamp: 90, transactions: [{ clauses: [{}, {}] }, { clauses: [{}, {}] }] },
      { timestamp: 80, transactions: [{ clauses: [{}, {}] }] },
    ]
    ;(useLatestBlocks as Mock).mockReturnValue({ data: mockBlocks, isPending: false })

    render(
      <ChakraProvider>
        <ClausesPerSecond numBlocks={2} />
      </ChakraProvider>,
    )

    const clausesPerSec = 9 / (100 - 80)
    expect(screen.getByText(clausesPerSec.toLocaleString() + " per second")).toBeInTheDocument()
    expect(screen.getByText("Last 2 blocks")).toBeInTheDocument()
  })

  it("renders 0 transactions per second if not enough blocks", () => {
    const mockBlocks = [{ timestamp: 100, transactions: [{}, {}, {}] }]
    ;(useLatestBlocks as Mock).mockReturnValue({ data: mockBlocks, isPending: false })

    render(
      <ChakraProvider>
        <ClausesPerSecond numBlocks={3} />
      </ChakraProvider>,
    )

    expect(screen.getByText("0 per second")).toBeInTheDocument()
    expect(screen.getByText("Last 3 blocks")).toBeInTheDocument()
  })
})
