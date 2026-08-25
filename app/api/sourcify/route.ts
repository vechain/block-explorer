import type { NextRequest } from 'next/server'
import { createCachedProxy } from '@/lib/cached-proxy'
import { sourcifyEndpoint } from '@/lib/sourcify-cache'

const proxy = createCachedProxy({ name: 'sourcify', endpoints: { '': sourcifyEndpoint } })

export const GET = (request: NextRequest) => proxy.handle(request)
