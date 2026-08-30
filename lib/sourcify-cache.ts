import type { Abi } from 'viem'
import { z } from 'zod'
import { SOURCIFY_URL } from '@/env.api'
import { defineEndpoint } from '@/lib/cached-proxy'
import { fetchUpstream, NotFoundError, UpstreamError } from './upstream-error'

const HOUR = 3_600
const DAY = 86_400
const WEEK = 604_800

interface SourcifyHit {
  abi: Abi
  contractName?: string
}

// v2 returns the ABI as a top-level field via `?fields=abi,compilation`. v1 is being
// deprecated through 503 brownouts, so we use v2 directly.
interface SourcifyV2Response {
  abi?: Abi
  compilation?: {
    name?: string
    fullyQualifiedName?: string
  }
  match?: string | null
}

export const sourcifyEndpoint = defineEndpoint({
  params: z.object({
    chainId: z.string().regex(/^\d+$/),
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .transform(address => address.toLowerCase()),
  }),
  invalidParamsMessage: 'chainId must be numeric and address must be a hex address',

  cache: { ttl: DAY, stale: WEEK, browserMaxAge: HOUR, size: 10_000 },

  // Shorter than a hit: verifying a contract is the one thing that changes this answer.
  notFound: {
    ttl: HOUR,
    stale: WEEK,
    browserMaxAge: HOUR,
    size: 10_000,
    message: 'Contract not verified on Sourcify',
  },

  fetch: async ({ chainId, address }): Promise<SourcifyHit> => {
    const res = await fetchUpstream(
      'sourcify',
      `${SOURCIFY_URL}/v2/contract/${chainId}/${address}?fields=abi,compilation`,
      {
        signal: AbortSignal.timeout(10_000),
      },
    )
    if (res.status === 404) throw new NotFoundError()
    if (!res.ok) throw new UpstreamError('sourcify', res.status)

    const body = (await res.json()) as SourcifyV2Response
    if (!body.abi || !Array.isArray(body.abi) || body.abi.length === 0) {
      throw new NotFoundError()
    }
    return { abi: body.abi, contractName: body.compilation?.name }
  },
})
