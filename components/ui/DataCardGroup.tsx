'use client'

import {
  Box,
  Flex,
  type FlexProps,
  Text,
  useBreakpointValue,
  Grid,
  HStack,
  GridProps,
  StackProps,
} from '@chakra-ui/react'
import React from 'react'
import type { IconBaseProps } from 'react-icons'
import { IconInCircle } from './IconInCircle'
import { InfoTip } from './InfoTip'
import { Card, type CardVariant } from './Card'

export interface DataCardGroupItem {
  icon?: React.ReactElement<IconBaseProps>
  title: React.ReactNode
  hiddenTitle?: boolean
  tooltip?: string
  children: React.ReactNode
  childrenContainerProps?: StackProps
}

interface DataCardGroupProps {
  /** Items to display in the card group */
  items: DataCardGroupItem[]
  /** Size of the icon */
  iconSize?: number | string
  /** Variant of the card */
  variant?: CardVariant
  /** Additional props passed to each card in desktop mode */
  cardProps?: FlexProps
  /** Additional props passed to each card in mobile mode */
  mobileCardProps?: FlexProps
  /** Force single card layout on all screen sizes */
  singleCard?: boolean
  /** Number of columns to display on desktop */
  desktopColumns?: number
  /** Gap between cards on desktop */
  desktopGap?: number
  /** Hide the card group on all screen sizes */
  hidden?: boolean
  /** Additional props passed to the desktop container */
  desktopContainerProps?: GridProps
}

export const DataCardGroup = ({
  items,
  iconSize = 12,
  variant = 'outline',
  desktopColumns = 2,
  desktopGap = 4,
  desktopContainerProps,
  cardProps,
  mobileCardProps,
  singleCard = false,
  hidden = false,
}: DataCardGroupProps) => {
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Desktop: render separate cards (unless singleCard is true)
  if (!isMobile && !singleCard) {
    return (
      <Grid
        templateColumns={`repeat(${desktopColumns}, 1fr)`}
        flex="1"
        alignSelf="stretch"
        minWidth="0"
        gap={desktopGap}
        hidden={hidden}
        {...desktopContainerProps}
      >
        {items.map((item, index) => {
          const Icon = item.icon
            ? React.cloneElement(item.icon, { ...item.icon.props, width: iconSize, height: iconSize })
            : undefined
          return (
            <Card key={index} variant={variant} flex="1" alignSelf="stretch" minWidth="0" {...cardProps}>
              {!item.hiddenTitle && (
                <Flex alignItems="center" justifyContent="space-between">
                  <HStack alignItems="center" gap="2">
                    {Icon && <IconInCircle icon={Icon} p="1" />}
                    <Text whiteSpace="nowrap" textStyle="bodyM" color="text-primary">
                      {item.title}
                    </Text>
                  </HStack>
                  {item.tooltip && <InfoTip tooltip={item.tooltip} />}
                </Flex>
              )}
              <HStack alignItems="center" justifyContent="flex-start">
                {item.children}
              </HStack>
            </Card>
          )
        })}
      </Grid>
    )
  }

  // Mobile: render single card with separator lines
  return (
    <Card variant={variant} flex="1" gap="0" py="1" {...mobileCardProps} hidden={hidden}>
      {items.map((item, index) => {
        const Icon = item.icon
          ? React.cloneElement(item.icon, { ...item.icon.props, width: iconSize, height: iconSize })
          : undefined
        const isLast = index === items.length - 1

        return (
          <Box key={index} py="3" borderBottomWidth={isLast ? '0' : '1px'} borderColor="border-primary">
            <HStack alignItems="center" justifyContent="space-between" gap="4" minW="0">
              {!item.hiddenTitle && (
                <HStack alignItems="center" gap="2" minW="0" flexWrap="wrap">
                  {Icon && <IconInCircle icon={Icon} p="1" />}

                  <Text whiteSpace="nowrap" textStyle="bodyM" color="text-primary">
                    {item.title}
                  </Text>
                </HStack>
              )}

              <HStack
                justifyContent="flex-end"
                textAlign="right"
                alignItems="center"
                gap="2"
                minW="0"
                flexWrap="wrap"
                {...item.childrenContainerProps}
              >
                {item.children}
                {item.tooltip && <InfoTip tooltip={item.tooltip} />}
              </HStack>
            </HStack>
          </Box>
        )
      })}
    </Card>
  )
}
