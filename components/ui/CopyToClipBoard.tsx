import { Clipboard } from '@chakra-ui/react'

export const CopyToClipBoard = ({ value, size = '12px' }: { value: string; size?: string }) => {
  return (
    <Clipboard.Root value={value} display="flex" alignItems="center">
      <Clipboard.Trigger>
        <Clipboard.Indicator
          cursor="pointer"
          _icon={{ width: `${size} !important`, height: `${size} !important`, color: 'text-primary', opacity: 0.4 }}
        />
      </Clipboard.Trigger>
    </Clipboard.Root>
  )
}
