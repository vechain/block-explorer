import type { NextRequest } from 'next/server'
import { createCachedProxy } from '@/lib/cached-proxy'
import { THOR_ENDPOINTS } from '@/lib/thor-cache'

const proxy = createCachedProxy({ name: 'thor', endpoints: THOR_ENDPOINTS })

export const GET = (request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) =>
  proxy.handle(request, params)
