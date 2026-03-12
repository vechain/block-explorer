'use client'

import { Box, Flex, Input } from '@chakra-ui/react'
import { LuClock } from 'react-icons/lu'

interface HourlyDateInputProps {
  dateValue: string
  hourValue: string
  maxDate: string
  onDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onHourChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const HourlyDateInput = ({
  dateValue,
  hourValue,
  maxDate,
  onDateChange,
  onHourChange,
}: HourlyDateInputProps) => {
  return (
    <Flex align="center" gap={1} flexWrap="nowrap">
      <Input
        type="date"
        value={dateValue}
        max={maxDate}
        onChange={onDateChange}
        size="sm"
        width={{ base: '130px', sm: '140px' }}
      />
      <Box position="relative" width={{ base: '75px', sm: '85px' }} flexShrink={0}>
        <Input
          type="number"
          value={hourValue}
          min={0}
          max={23}
          onChange={onHourChange}
          size="sm"
          paddingRight="32px"
          placeholder="Hr"
          css={{
            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '&[type=number]': {
              MozAppearance: 'textfield',
            },
          }}
        />
        <Box
          position="absolute"
          right="8px"
          top="50%"
          transform="translateY(-50%)"
          pointerEvents="none"
          zIndex={1}
          color="fg.muted"
        >
          <LuClock size={16} />
        </Box>
      </Box>
    </Flex>
  )
}
