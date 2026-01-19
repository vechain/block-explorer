'use client'

import { Box, Button, EmptyState, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { AiOutlineStop } from 'react-icons/ai'

export const NotFound = ({ title, description }: { title?: string; description?: string }) => {
  const { t } = useTranslation()

  return (
    <Box>
      <EmptyState.Root size="md">
        <EmptyState.Content>
          <EmptyState.Indicator>
            <AiOutlineStop />
          </EmptyState.Indicator>
          <EmptyState.Title>{title ?? t('This page does not exist')}</EmptyState.Title>
          <EmptyState.Description display="flex" flexDirection="column" alignItems="center" gap="8">
            {description && <Text as="span">{description}</Text>}
            <Button asChild variant="subtle" colorPalette="purple" size="sm">
              <Link href="/">{t('Back to dashboard')}</Link>
            </Button>
          </EmptyState.Description>
        </EmptyState.Content>
      </EmptyState.Root>
    </Box>
  )
}
