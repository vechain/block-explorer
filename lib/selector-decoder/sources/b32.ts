import type { Abi } from 'viem'
import { getRuntimeConfig } from '@/lib/runtime-config/get'
import { UpstreamError } from '@/lib/upstream-error'

// b32 maps selector hash → ABI fragment. Returns null on 404, throws on
// transport / 5xx so the calling service decides how to cache the outcome.
// Sent without headers: b32 is GitHub Pages, which answers a preflight with 405.
export async function fetchB32(hash: string): Promise<Abi | null> {
  const res = await fetch(`${getRuntimeConfig().b32Url}/q/${hash}.json`, {
    signal: AbortSignal.timeout(10_000),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new UpstreamError('b32', res.status)
  return (await res.json()) as Abi
}
