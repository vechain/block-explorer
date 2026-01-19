import { Tooltip as ChakraTooltip, Portal } from '@chakra-ui/react'
import * as React from 'react'

interface TooltipProps extends ChakraTooltip.RootProps {
  showArrow?: boolean
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement>
  content: React.ReactNode
  contentProps?: ChakraTooltip.ContentProps
  disabled?: boolean
  interactive?: boolean
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  const { children, disabled, portalled = true, content, contentProps, portalRef, interactive, ...rest } = props

  if (disabled) return children

  return (
    <ChakraTooltip.Root
      openDelay={0}
      closeDelay={interactive ? 100 : 0}
      closeOnPointerDown={!interactive}
      positioning={{ placement: 'top' }}
      interactive={interactive}
      {...rest}
    >
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content
            ref={ref}
            css={{
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
            }}
            {...contentProps}
          >
            <ChakraTooltip.Arrow>
              <ChakraTooltip.ArrowTip />
            </ChakraTooltip.Arrow>
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  )
})
