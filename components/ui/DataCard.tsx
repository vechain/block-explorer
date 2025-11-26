'use client'

import type { FlexProps } from '@chakra-ui/react'
import { Flex, Group, Text } from '@chakra-ui/react'
import React, { forwardRef } from 'react'
import type { IconBaseProps } from 'react-icons'
import { LuInfo } from 'react-icons/lu'
import { IconInCircle } from './IconInCircle'
import { Tooltip } from './Tooltip'

interface DataCardProps extends FlexProps {
  icon: React.ReactElement<IconBaseProps>
  title: string
  tooltip?: string
}

export const DataCard = forwardRef<HTMLDivElement, DataCardProps>(
  ({ children, icon, title, tooltip, ...props }, ref) => {
    const Icon = React.cloneElement(icon, icon.props)

    return (
      <Flex
        ref={ref}
        flexDirection="column"
        flex="1"
        alignSelf="stretch"
        // w={{ base: 'full', md:'auto' }}
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
            <Tooltip
              showArrow
              positioning={{ placement: 'top' }}
              contentProps={{
                css: {
                  '--tooltip-bg': 'colors.gray.800',
                  // TODO fix arrow styling
                  // '--arrow-background': 'red.500',
                  color: 'text-primary',
                  textStyle: 'bodyM',
                  px: '2',
                  py: '3',
                  maxW: '200px',
                  borderRadius: 'xs',
                  borderColor: 'colors.gray.700',
                },
              }}
              content={tooltip}>
              <LuInfo size={16} />
            </Tooltip>
          )}
        </Flex>
        {children}
      </Flex>
    )
  },
)

DataCard.displayName = 'DataCard'
