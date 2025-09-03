import { Box, Clipboard, Flex, IconButton } from '@chakra-ui/react'

export const CopyToClipBoard = ({ value }: { value: string }) => {
  return (
    <Clipboard.Root value={value}>
      <Clipboard.Trigger asChild>
        <IconButton variant="ghost" size="xs" aria-label="Copy to clipboard">
          <Clipboard.Indicator />
        </IconButton>
      </Clipboard.Trigger>
    </Clipboard.Root>
  )
}

export const CopyableText = ({ value }: { value: string }) => {
  return (
    <Box display="inline-block">
      <Flex alignItems="center" gap={2}>
        {value} <CopyToClipBoard value={value} />
      </Flex>
    </Box>
  )
}
