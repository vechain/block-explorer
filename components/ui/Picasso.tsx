'use client'

import { Box } from '@chakra-ui/react'
import { picasso } from '@vechain/picasso'
import { useMemo } from 'react'

interface PicassoProps {
  address: string
  size?: number | string
}

/**
 * Picasso component renders a deterministic identicon for a VeChain address.
 * Uses the @vechain/picasso library to generate unique SVG identicons.
 */
export const Picasso = ({ address, size = 48 }: PicassoProps) => {
  const svgDataUri = useMemo(() => {
    const svg = picasso(address.toLowerCase())
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }, [address])

  return (
    <Box
      width={typeof size === 'number' ? `${size}px` : size}
      height={typeof size === 'number' ? `${size}px` : size}
      borderRadius="full"
      overflow="hidden"
      flexShrink={0}
      backgroundImage={`url("${svgDataUri}")`}
      backgroundSize="cover"
      backgroundPosition="center"
    />
  )
}
