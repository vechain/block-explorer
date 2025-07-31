import { Heading, HeadingProps, Text, TextProps } from "@chakra-ui/react"

export const Title = (props: HeadingProps) => {
  return <Heading as="h1" size="2xl" fontWeight="bold" color="fg" {...props} />
}

export const Subtitle = (props: TextProps) => {
  return <Text fontSize="md" color="fg.muted" {...props} />
}
