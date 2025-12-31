'use client'

import type { FlexProps } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react'
import { forwardRef } from 'react'

const variantStyles = {
  primary: {
    bg: 'card-bg-primary',
  },
  secondary: {
    bg: 'bg-secondary',
    border: 'none',
  },
  tertiary: {
    bg: 'bg-alt-primary',
    border: 'none',
    backdropFilter: 'none',
  },
  outline: {
    bg: 'none',
    backdropFilter: 'none',
  },
}

type CardProps = FlexProps & {
  variant?: keyof typeof variantStyles
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ variant = 'primary', ...props }, ref) => {
  const variantStyle = variantStyles[variant]

  return (
    <Flex
      ref={ref}
      flexDirection="column"
      gap={6}
      color="text-primary"
      borderRadius="md"
      borderWidth="1px"
      borderColor="border-primary"
      p={{ base: 4, md: 5 }}
      backdropFilter="blur(16px)"
      {...variantStyle}
      {...props}
    />
  )
})

Card.displayName = 'Card'
