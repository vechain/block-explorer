import { Box, Flex, type FlexProps, Text } from '@chakra-ui/react'
import { motion } from 'motion/react'

interface ValueSwitchProps<T> extends Omit<FlexProps, 'onChange'> {
  values: T[]
  activeValue: T
  onChange: (value: T) => void
}

export const ValueSwitch = <T,>({ values, activeValue, onChange, ...props }: ValueSwitchProps<T>) => {
  return (
    <Flex
      gap={1}
      alignItems="center"
      bg="bg-surface-alt-hover"
      p={2}
      rounded="full"
      textStyle="bodyMSemibold"
      w="fit-content"
      border="0.5px solid var(--chakra-colors-border-surface-3)"
      {...props}>
      {values.map(value => (
        <Item key={String(value)} value={value} activeValue={activeValue} onChange={onChange} />
      ))}
    </Flex>
  )
}

const Item = <T,>({ value, activeValue, onChange }: { value: T; activeValue: T; onChange: (value: T) => void }) => {
  const isActive = value === activeValue

  return (
    <Box p={2} cursor="pointer" position="relative" onClick={() => onChange(value)}>
      {isActive && (
        <MotionBox
          position="absolute"
          layoutId="pill"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="white"
          color="bg-primary"
          rounded="full"
        />
      )}
      <Text as="span" position="relative" color={isActive ? 'bg-primary' : 'text-primary'} textTransform="capitalize">
        {String(value)}
      </Text>
    </Box>
  )
}

const MotionBox = motion.create(Box)
