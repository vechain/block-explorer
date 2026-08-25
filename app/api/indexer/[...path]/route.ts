import type { NextRequest } from 'next/server'
import { createCachedProxy } from '@/lib/cached-proxy'
import { INDEXER_ENDPOINTS } from '@/lib/indexer-cache'

const proxy = createCachedProxy({ name: 'indexer', endpoints: INDEXER_ENDPOINTS })

export const GET = (request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) =>
  proxy.handle(request, params)
