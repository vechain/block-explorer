import { Clipboard, IconButton } from "@chakra-ui/react"

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
