'use client'

import { Box } from '@chakra-ui/react'
import Image from 'next/image'
import { type CSSProperties } from 'react'

interface BackgroundImageProps {
  mobileSrc: string
  desktopSrc: string
  alt?: string
}

export const BackgroundImage = ({ mobileSrc, desktopSrc, alt = 'background' }: BackgroundImageProps) => {
  return (
    <>
      {/* Mobile background */}
      <Box
        as="span"
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        zIndex={0}
        display={{ base: 'block', md: 'none' }}
        pointerEvents="none"
        overflow="hidden"
      >
        <Image
          src={mobileSrc}
          alt={alt}
          fill
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'top center' } as CSSProperties}
          priority
          quality={85}
        />
      </Box>
      {/* Desktop background */}
      <Box
        as="span"
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        zIndex={0}
        display={{ base: 'none', md: 'block' }}
        pointerEvents="none"
        overflow="hidden"
      >
        <Image
          src={desktopSrc}
          alt={alt}
          fill
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'top center' } as CSSProperties}
          priority
          quality={85}
        />
      </Box>
    </>
  )
}
