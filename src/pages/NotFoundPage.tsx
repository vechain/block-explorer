import { Text } from "@chakra-ui/react"
import { useLocation } from "react-router-dom"
import { Stack } from "@chakra-ui/react"
import { Title } from "@/components/ui/Typography"

const DEFAULT_MESSAGE = "Page not found"

export const NotFoundPage = () => {
  const { state } = useLocation()
  const message = state?.message ?? DEFAULT_MESSAGE

  return (
    <Stack flex={1} alignItems="center" justifyContent="center">
      <Title>Oops! This page does not exist</Title>
      <Text>{message}</Text>
    </Stack>
  )
}
