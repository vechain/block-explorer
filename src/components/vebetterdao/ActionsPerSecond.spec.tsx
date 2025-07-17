import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, Mock } from "vitest"
import { ActionsPerSecond } from "./ActionsPerSecond"
import { useB3trRewardDistributedEvents } from "@/hooks/thor/useB3trRewardDistributedEvents"
import { ChakraProvider } from "@/components/ui/provider"
import "@testing-library/jest-dom"

// Mock the useLatestB3trActions hook
vi.mock("@/hooks/thor/useB3trRewardDistributedEvents")

describe("ActionsPerSecond", () => {
  it("should display the correct actions per second", () => {
    // Mock the data returned by the hook
    ;(useB3trRewardDistributedEvents as Mock).mockReturnValue({
      data: Array(100).fill({}), // Mock 100 actions
    })

    render(
      <ChakraProvider>
        <ActionsPerSecond numBlocks={10} />
      </ChakraProvider>,
    )

    // Check if the correct actions per second is displayed
    expect(screen.getByText("1 per second")).toBeInTheDocument()
    expect(screen.getByText("Last 10 blocks")).toBeInTheDocument()
  })

  it("should display 0 actions per second when no actions are returned", () => {
    // Mock the data returned by the hook
    ;(useB3trRewardDistributedEvents as Mock).mockReturnValue({
      data: [],
    })

    render(
      <ChakraProvider>
        <ActionsPerSecond numBlocks={10} />
      </ChakraProvider>,
    )

    // Check if 0 actions per second is displayed
    expect(screen.getByText("0 per second")).toBeInTheDocument()
    expect(screen.getByText("Last 10 blocks")).toBeInTheDocument()
  })
})
