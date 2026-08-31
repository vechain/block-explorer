import type { AbiItem } from 'viem'
import { UpstreamError } from '@/lib/upstream-error'
import { fetchB32 } from './sources/b32'
import { fetchOpenchain } from './sources/openchain'

// b32 gives a full ABI fragment; OpenChain gives a bare signature the client must
// interpret, since indexed params depend on the caller's topic count.
type DecodedSelector = { source: 'b32'; abi: AbiItem } | { source: 'openchain'; signature: string }

export type SelectorKind = 'function' | 'event'

const isAbi = (value: unknown): value is AbiItem[] => Array.isArray(value) && value.length > 0

const FUNCTION_HASH = /^0x[a-f0-9]{8}$/
const EVENT_HASH = /^0x[a-f0-9]{64}$/

/** Null is a definitive miss; a throw is an outage, which the caller must not cache as one. */
export const decodeSelector = async (kind: SelectorKind, rawHash: string): Promise<DecodedSelector | null> => {
  // b32's path is case-sensitive and OpenChain echoes lowercase keys.
  const hash = rawHash.toLowerCase()
  if (!(kind === 'function' ? FUNCTION_HASH : EVENT_HASH).test(hash)) return null

  const [b32Result, openchainResult] = await Promise.allSettled([fetchB32(hash), fetchOpenchain(kind, hash)])

  if (b32Result.status === 'fulfilled' && isAbi(b32Result.value)) {
    const item = b32Result.value[0]
    if (item) return { source: 'b32', abi: item }
  }

  if (openchainResult.status === 'fulfilled' && openchainResult.value) {
    return { source: 'openchain', signature: openchainResult.value }
  }

  // Only a genuine miss if at least one source answered — otherwise surface the
  // outage rather than caching it as not-found.
  if (b32Result.status === 'rejected' && openchainResult.status === 'rejected') {
    throw b32Result.reason instanceof UpstreamError ? b32Result.reason : openchainResult.reason
  }

  return null
}
