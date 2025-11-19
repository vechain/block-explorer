import { Clipboard } from '@chakra-ui/react'

export const CopyToClipBoard = ({ value }: { value: string }) => {
  return (
    <Clipboard.Root value={value} display="flex" alignItems="center">
      <Clipboard.Trigger>
        <Clipboard.Indicator
          cursor="pointer"
          _icon={{ width: '12px !important', height: '12px !important', color: 'text-primary', opacity: 0.4 }}
        />
      </Clipboard.Trigger>
    </Clipboard.Root>
  )
}
