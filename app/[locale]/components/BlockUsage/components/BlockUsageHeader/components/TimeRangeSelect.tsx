'use client'

import { Portal, Select } from '@chakra-ui/react'
import { type TimeRangeKey, timeRangeCollection } from '../../../constants'

interface TimeRangeSelectProps {
  selectedRange: TimeRangeKey
  onRangeChange: (newRange: TimeRangeKey) => void
}

export const TimeRangeSelect = ({ selectedRange, onRangeChange }: TimeRangeSelectProps) => {
  return (
    <Select.Root
      collection={timeRangeCollection}
      value={[selectedRange]}
      onValueChange={details => onRangeChange(details.value[0] as TimeRangeKey)}
      size="sm"
      variant="outline"
      width={'100px'}>
      <Select.Trigger>
        <Select.ValueText placeholder="Select time range" />
      </Select.Trigger>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {timeRangeCollection.items.map(item => (
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
