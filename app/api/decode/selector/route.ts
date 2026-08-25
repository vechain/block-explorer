import type { NextRequest } from 'next/server'
import { createCachedProxy } from '@/lib/cached-proxy'
import { selectorEndpoint } from '@/lib/selector-decoder'

const proxy = createCachedProxy({ name: 'decode/selector', endpoints: { '': selectorEndpoint } })

export const GET = (request: NextRequest) => proxy.handle(request)
