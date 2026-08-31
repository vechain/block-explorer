'use client'

import { useTranslation } from 'react-i18next'
import z from 'zod'
import { NotFound } from '@/components/error/NotFound'
import { useRouteSegments } from '@/hooks/useRouteSegments'
import { addressStringSchema } from '@/lib/schemas'
import { NftDetailPageContent } from './NftDetailPageContent'

const tokenIdParamSchema = z.string().regex(/^\d+$/)

export function NftDetailRoute() {
  const { t } = useTranslation()
  const [, contractAddressParam, tokenIdParam] = useRouteSegments()
  const contractAddress = addressStringSchema.safeParse(contractAddressParam)
  const tokenId = tokenIdParamSchema.safeParse(tokenIdParam)

  if (!contractAddress.success || !tokenId.success) {
    return <NotFound title={t('NFT not found')} description={t('The NFT you are looking for does not exist')} />
  }

  return <NftDetailPageContent contractAddress={contractAddress.data} tokenId={BigInt(tokenId.data)} />
}
