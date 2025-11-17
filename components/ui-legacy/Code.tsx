import { Code as CodeChakra, type CodeProps, Text } from '@chakra-ui/react'

export const Code = ({ children, ...props }: { children: React.ReactNode } & CodeProps) => {
  return (
    <CodeChakra p={4} w="100%" {...props}>
      <Text as="span" whiteSpace="normal" wordBreak="break-all" lineClamp={3}>
        {children}
      </Text>
    </CodeChakra>
  )
}
