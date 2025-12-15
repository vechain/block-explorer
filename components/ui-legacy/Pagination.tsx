'use client'

import { Button, Flex, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'

export const Pagination = ({
  page,
  hasNext,
  onPageChange,
}: {
  onPageChange: (page: number) => void
  page: number
  hasNext: boolean
}) => {
  const { t } = useTranslation()

  return (
    <Flex justifyContent="center" gap={2} alignItems="center">
      <Button variant="ghost" size="xs" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
        <LuChevronLeft />
      </Button>
      <Text>
        {t('Page')} {page + 1}
      </Text>
      <Button variant="ghost" size="xs" onClick={() => onPageChange(page + 1)} disabled={!hasNext}>
        <LuChevronRight />
      </Button>
    </Flex>
  )
}
