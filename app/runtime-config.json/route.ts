import { NextResponse } from 'next/server'
import { readRuntimeConfigFromEnv } from '@/lib/runtime-config/from-env'

// All that is left reading the container's env per request, so every page above it can cache.
export const dynamic = 'force-dynamic'

export const GET = () => NextResponse.json(readRuntimeConfigFromEnv(), { headers: { 'Cache-Control': 'no-store' } })
