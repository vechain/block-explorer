'use client'

import type { FlexProps } from '@chakra-ui/react'
import { Flex, Image } from '@chakra-ui/react'
import { forwardRef } from 'react'
import { Picasso } from './Picasso'
import { CopyableString } from './CopyableString'

interface IDChipProps extends FlexProps {
  value: string
  vnsName?: string | null
  avatarAlt?: string
  avatarSrc?: string | null
  showPicasso?: boolean
}
export const IDChip = forwardRef<HTMLDivElement, IDChipProps>(
  ({ value, vnsName, avatarAlt, avatarSrc, showPicasso = false, ...props }, ref) => {
    const displayValue = vnsName || value

    return (
      <Flex
        ref={ref}
        py="2"
        px="2"
        gap="2"
        w="fit-content"
        alignItems="center"
        bg="bg-primary"
        color="text-secondary"
        borderRadius="full"
        borderWidth="1px"
        borderColor="border-primary"
        maxW="full"
        {...props}
      >
        {avatarSrc ? (
          <Image src={avatarSrc} alt={avatarAlt ?? 'Avatar'} boxSize="4" borderRadius="full" flexShrink={0} />
        ) : showPicasso ? (
          <Picasso address={value} size={16} />
        ) : (
          <Image src="/images/sphere.png" alt="Sphere" width={4} height={4} />
        )}
        <CopyableString
          value={value}
          title={displayValue}
          containerProps={{ flex: 1 }}
          maxWidth="full"
          textStyle="bodyS"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {displayValue}
        </CopyableString>
      </Flex>
    )
  },
)

IDChip.displayName = 'IDChip'
