'use client'

import { useTranslation } from 'react-i18next'
import { NotFound } from '@/components/error/NotFound'
import { useRouteSegments } from '@/hooks/useRouteSegments'
import { blockRevisionSchema } from '@/lib/schemas'
import { BlockDetails } from './components/BlockDetails'

export default function BlockPage() {
  const { t } = useTranslation()
  const [, blockIdParam] = useRouteSegments()
  const blockId = blockRevisionSchema.safeParse(blockIdParam)

  if (!blockId.success) return <NotFound title={t('The block you are looking for does not exist')} />

  return <BlockDetails blockId={blockId.data} />
}
