import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import z from 'zod'

// ISR: Cache page for 60 seconds - NFT ownership can change but infrequently
export const revalidate = 60

import { getQueryClient } from '@/lib/query-client/query-client'
import { addressStringSchema, type AddressString } from '@/lib/schemas'
import { NftDetailPageContent } from './components/NftDetailPageContent'

const tokenIdParamSchema = z.string().regex(/^\d+$/)

export default async function NftDetailPage({
  params,
}: {
  params: Promise<{ contractAddress: string; tokenId: string }>
}) {
  const { contractAddress, tokenId } = await params

  if (!addressStringSchema.safeParse(contractAddress).success || !tokenIdParamSchema.safeParse(tokenId).success) {
    notFound()
  }

  const validContractAddress = contractAddress as AddressString
  const validTokenId = BigInt(tokenId)

  const queryClient = getQueryClient()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NftDetailPageContent contractAddress={validContractAddress} tokenId={validTokenId} />
    </HydrationBoundary>
  )
}
