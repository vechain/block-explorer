'use client'

import { createListCollection, Portal, Select } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { type TimeRangeKey, timeRangeCollection } from '@/lib/constants/time-ranges'
import type { TranslationKey } from '@/i18n/types'

interface TimeRangeSelectProps {
  selectedRange: TimeRangeKey
  onRangeChange: (newRange: TimeRangeKey) => void
  excludeRanges?: TimeRangeKey[]
}

export const TimeRangeSelect = ({ selectedRange, onRangeChange, excludeRanges }: TimeRangeSelectProps) => {
  const { t } = useTranslation()
  const filteredItems = excludeRanges
    ? timeRangeCollection.items.filter(item => !excludeRanges.includes(item.value))
    : timeRangeCollection.items
  const translatedTimeRanges = createListCollection<{ label: string; value: TimeRangeKey }>({
    items: filteredItems.map(item => ({
      ...item,
      label: t(item.label as TranslationKey),
    })),
  })
  return (
    <Select.Root
      collection={translatedTimeRanges}
      value={[selectedRange]}
      onValueChange={details => onRangeChange(details.value[0] as TimeRangeKey)}
      size="sm"
      variant="outline"
      width={'100px'}
    >
      <Select.Trigger>
        <Select.ValueText placeholder="Select time range" />
      </Select.Trigger>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {translatedTimeRanges.items.map(item => (
              <Select.Item key={item.value} item={item}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}
