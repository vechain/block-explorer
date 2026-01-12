import { Box, Flex, type FlexProps, Text } from '@chakra-ui/react'
import { motion } from 'motion/react'

interface ValueSwitchProps extends Omit<FlexProps, 'onChange'> {
  values: string[]
  layoutId: string
  activeValue: string
  onChange: (value: string) => void
}

export const ValueSwitch = ({ values, layoutId, activeValue, onChange, ...props }: ValueSwitchProps) => {
  return (
    <Flex
      gap={1}
      alignItems="center"
      bg="bg-secondary"
      p={1}
      rounded="full"
      textTransform="capitalize"
      border="0.5px solid var(--chakra-colors-border-primary)"
      w="fit-content"
      {...props}
    >
      {values.map(value => (
        <Item key={String(value)} value={value} layoutId={layoutId} activeValue={activeValue} onChange={onChange} />
      ))}
    </Flex>
  )
}

const Item = ({
  value,
  layoutId,
  activeValue,
  onChange,
}: {
  value: string
  layoutId: string
  activeValue: string
  onChange: (value: string) => void
}) => {
  const isActive = value === activeValue

  return (
    <Flex p={2} cursor="pointer" position="relative" onClick={() => onChange(value)}>
      {isActive && (
        <MotionBox
          position="absolute"
          layoutId={layoutId}
          inset="0"
          bg="white"
          color="bg-primary"
          rounded="full"
          transition={{
            type: 'spring',
            bounce: 0.2,
            duration: 0.4,
          }}
        />
      )}

      <Text
        as="span"
        position="relative"
        color={isActive ? 'text-alt-primary' : 'text-primary'}
        textStyle={isActive ? 'bodyMSemibold' : 'bodyM'}
        lineHeight="1"
      >
        {String(value.replace(/-/g, ' '))}
      </Text>
    </Flex>
  )
}

const MotionBox = motion.create(Box)
