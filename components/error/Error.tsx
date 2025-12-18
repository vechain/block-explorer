'use client'

import { AbsoluteCenter, Box, Button, EmptyState, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { AiOutlineStop } from 'react-icons/ai'

export const ErrorComponent = ({ title, description }: { title?: string; description?: string }) => {
  const { t } = useTranslation()

  return (
    <Box position="fixed" bg="bg-primary" top="0" left="0" right="0" bottom="0">
      <AbsoluteCenter>
        <EmptyState.Root size="md">
          <EmptyState.Content>
            <EmptyState.Title>{title ?? t('Oops! Something went wrong')}</EmptyState.Title>

            <EmptyState.Indicator>
              <AiOutlineStop />
            </EmptyState.Indicator>

            <EmptyState.Description display="flex" flexDirection="column" alignItems="center" gap="8">
              {description && <Text as="span">{description}</Text>}
              <Button asChild variant="subtle" colorPalette="purple" size="sm">
                <Link href="/">{t('Back to dashboard')}</Link>
              </Button>
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      </AbsoluteCenter>
    </Box>
  )
}
