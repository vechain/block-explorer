import { Clipboard } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

export const CopyToClipBoard = ({ value, size = '12px' }: { value: string; size?: string }) => {
  const { t } = useTranslation()
  return (
    <Clipboard.Root value={value} display="flex" alignItems="center">
      <Clipboard.Trigger aria-label={t('Copy to clipboard')}>
        <Clipboard.Indicator
          cursor="pointer"
          _icon={{ width: `${size} !important`, height: `${size} !important`, color: 'text-primary', opacity: 0.4 }}
        />
      </Clipboard.Trigger>
    </Clipboard.Root>
  )
}
