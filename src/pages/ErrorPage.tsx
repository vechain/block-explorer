import { EmptyState, Button, Flex } from "@chakra-ui/react"
import { AiOutlineStop } from "react-icons/ai"
import { useNavigate } from "react-router-dom"
import { FallbackProps } from "react-error-boundary"

export const ErrorPage = ({ resetErrorBoundary }: FallbackProps) => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    resetErrorBoundary()
    navigate("/")
  }

  return (
    <Flex h="100%" flexDirection="column" justifyContent="center">
      <EmptyState.Root size="md">
        <EmptyState.Content>
          <EmptyState.Indicator>
            <AiOutlineStop />
          </EmptyState.Indicator>

          <EmptyState.Title>Oops! Something went wrong</EmptyState.Title>

          <EmptyState.Description>
            <Button variant="subtle" colorPalette="purple" size="sm" onClick={handleGoHome}>
              Back to dashboard
            </Button>
          </EmptyState.Description>
        </EmptyState.Content>
      </EmptyState.Root>
    </Flex>
  )
}
