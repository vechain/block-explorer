'use client'

import { useTranslation } from 'react-i18next'
import { NotFound } from '@/components/error/NotFound'
import { useRouteSegments } from '@/hooks/useRouteSegments'
import { transactionIdSchema } from '@/lib/schemas'
import { TransactionPageContent } from './components/TransactionPageContent'

export default function TransactionPage() {
  const { t } = useTranslation()
  const [, transactionIdParam] = useRouteSegments()
  const transactionId = transactionIdSchema.safeParse(transactionIdParam)

  if (!transactionId.success) return <NotFound title={t('The transaction you are looking for does not exist')} />

  return <TransactionPageContent transactionId={transactionId.data} />
}
