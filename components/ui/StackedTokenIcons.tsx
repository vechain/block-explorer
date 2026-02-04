'use client'

import { Box } from '@chakra-ui/react'
import Image from 'next/image'
import { getTokenIconPath } from '@/lib/utils/tokens'

interface StackedTokenIconsProps {
  symbols: string[]
  size?: number
}

/**
 * Renders multiple token icons stacked/overlapping horizontally.
 * Used for combined token displays (e.g., B3TR/VOT3).
 */
export const StackedTokenIcons = ({ symbols, size = 16 }: StackedTokenIconsProps) => {
  // Get icon paths for all symbols
  const iconPaths = symbols.map(symbol => ({ symbol, path: getTokenIconPath(symbol) })).filter(item => item.path)

  if (iconPaths.length === 0) return null

  // Calculate total width: first icon full width + offset for each additional icon
  const offset = size * 0.5
  const totalWidth = size + (iconPaths.length - 1) * offset

  return (
    <Box position="relative" width={`${totalWidth}px`} height={`${size}px`}>
      {iconPaths.map((item, index) => (
        <Box
          key={item.symbol}
          position="absolute"
          left={`${index * offset}px`}
          zIndex={iconPaths.length - index}
          borderRadius="full"
          overflow="hidden"
          boxShadow={index > 0 ? '0 0 0 1px var(--chakra-colors-bg-primary)' : undefined}
        >
          <Image src={item.path!} alt={item.symbol} width={size} height={size} />
        </Box>
      ))}
    </Box>
  )
}
