import { Heading, Text } from "@chakra-ui/react"

export const Title = ({ children }: { children: React.ReactNode }) => {
  return (
    <Heading as="h1" size="2xl" fontWeight="bold" color="fg">
      {children}
    </Heading>
  )
}

export const Subtitle = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text fontSize="md" color="fg.muted">
      {children}
    </Text>
  )
}
