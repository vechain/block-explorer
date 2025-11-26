'use client'

import { Flex, type FlexProps, Group, Text } from '@chakra-ui/react'
import Image from 'next/image'
import React, { forwardRef } from 'react'
import type { IconBaseProps } from 'react-icons'
import { IconInCircle } from './IconInCircle'
import { Tooltip } from './Tooltip'

interface DataCardProps extends FlexProps {
  icon: React.ReactElement<IconBaseProps>
  title: string
  tooltip?: string
}

export const DataCard = forwardRef<HTMLDivElement, DataCardProps>(
  ({ children, icon, title, tooltip, ...props }, ref) => {
    const Icon = React.cloneElement(icon, { ...icon.props, width: 12, height: 12 })

    return (
      <Flex
        ref={ref}
        flexDirection="column"
        flex="1"
        justifyContent="space-between"
        alignSelf="stretch"
        gap={6}
        bg="bg-surface-alt-1"
        color="text-primary"
        borderRadius="md"
        borderWidth="1px"
        borderColor="bg-card-surface-2"
        py={5}
        px={4}
        {...props}>
        <Flex alignItems="center" justifyContent="space-between">
          <Group>
            <IconInCircle icon={Icon} p="1" />
            <Text whiteSpace="nowrap" textStyle="bodyM">
              {title}
            </Text>
          </Group>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Image src="/icons/info.svg" alt="Info" width={16} height={16} />
            </Tooltip>
          )}
        </Flex>
        {children}
      </Flex>
    )
  },
)

DataCard.displayName = 'DataCard'
