import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, Mock } from "vitest"
import { ChakraProvider } from "@chakra-ui/react"
import { ActionsPerSecond } from "./ActionsPerSecond"
import { useLatestB3trActions } from "@/hooks/vebetterdao/useLatestB3trActions"
import { config } from "@/components/ui/Theme.tsx"
import "@testing-library/jest-dom"

// Mock the useLatestB3trActions hook
vi.mock("@/hooks/vebetterdao/useLatestB3trActions")

describe("ActionsPerSecond", () => {
  it("should display the correct actions per second", () => {
    // Mock the data returned by the hook
    ;(useLatestB3trActions as Mock).mockReturnValue({
      data: Array(100).fill({}), // Mock 100 actions
    })

    render(
      <ChakraProvider value={config}>
        <ActionsPerSecond numBlocks={10} />
      </ChakraProvider>,
    )

    // Check if the correct actions per second is displayed
    expect(screen.getByText("1 per second")).toBeInTheDocument()
    expect(screen.getByText("Last 10 blocks")).toBeInTheDocument()
  })

  it("should display 0 actions per second when no actions are returned", () => {
    // Mock the data returned by the hook
    ;(useLatestB3trActions as Mock).mockReturnValue({
      data: [],
    })

    render(
      <ChakraProvider value={config}>
        <ActionsPerSecond numBlocks={10} />
      </ChakraProvider>,
    )

    // Check if 0 actions per second is displayed
    expect(screen.getByText("0 per second")).toBeInTheDocument()
    expect(screen.getByText("Last 10 blocks")).toBeInTheDocument()
  })
})
