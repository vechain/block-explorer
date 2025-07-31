import { Button, EmptyState, Flex, Text } from "@chakra-ui/react"
import { useLocation, useNavigate } from "react-router-dom"
import { AiOutlineStop } from "react-icons/ai"

const DEFAULT_MESSAGE = "Page not found"

export const NotFoundPage = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const message = state?.message ?? DEFAULT_MESSAGE

  const handleGoHome = () => {
    navigate("/")
  }

  return (
    <Flex h="100vh" flexDirection="column" justifyContent="center" alignItems="center">
      <EmptyState.Root size="md">
        <EmptyState.Content>
          <EmptyState.Indicator>
            <AiOutlineStop />
          </EmptyState.Indicator>

          <EmptyState.Title>This page does not exist</EmptyState.Title>

          <EmptyState.Description display="flex" flexDirection="column" alignItems="center" gap="8">
            <Text>{message}</Text>
            <Button variant="subtle" colorPalette="purple" size="sm" onClick={handleGoHome}>
              Back to dashboard
            </Button>
          </EmptyState.Description>
        </EmptyState.Content>
      </EmptyState.Root>
    </Flex>
  )
}
