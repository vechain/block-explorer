'use client'

import { Flex, type FlexProps, Text } from '@chakra-ui/react'
import { MotionBox } from './MotionBox'

export interface ToggleOption<T = string> {
  value: T
  label: string
}

interface ToggleGroupProps<T = string> extends Omit<FlexProps, 'onChange'> {
  options: ToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  layoutId: string
  size?: 'sm' | 'md'
}

export const ToggleGroup = <T extends string | number>({
  options,
  value,
  onChange,
  layoutId,
  size = 'md',
  ...props
}: ToggleGroupProps<T>) => {
  return (
    <Flex
      align="center"
      gap={size === 'sm' ? 0 : 1}
      bg="bg-primary"
      borderRadius="full"
      borderWidth="1px"
      borderColor="border-primary"
      p="1"
      {...props}
    >
      {options.map(option => (
        <ToggleItem
          key={String(option.value)}
          option={option}
          isActive={option.value === value}
          layoutId={layoutId}
          size={size}
          onClick={() => onChange(option.value)}
        />
      ))}
    </Flex>
  )
}

interface ToggleItemProps<T> {
  option: ToggleOption<T>
  isActive: boolean
  layoutId: string
  size: 'sm' | 'md'
  onClick: () => void
}

const ToggleItem = <T,>({ option, isActive, layoutId, size, onClick }: ToggleItemProps<T>) => {
  const px = size === 'sm' ? 2 : 3
  const textStyle = size === 'sm' ? 'bodySSemibold' : 'bodyMSemibold'

  return (
    <Flex
      as="button"
      align="center"
      justify="center"
      position="relative"
      px={px}
      py={size === 'sm' ? 2 : 3}
      borderRadius="full"
      cursor="pointer"
      onClick={onClick}
      transition="color 0.2s"
      color={isActive ? 'text-alt-primary' : 'fg'}
    >
      {isActive && (
        <MotionBox
          position="absolute"
          layoutId={layoutId}
          inset="0"
          bg="white"
          rounded="full"
          transition={{
            type: 'spring',
            bounce: 0.2,
            duration: 0.4,
          }}
        />
      )}

      <Text as="span" position="relative" textStyle={textStyle} lineHeight="1">
        {option.label}
      </Text>
    </Flex>
  )
}
