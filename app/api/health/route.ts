import { NextResponse } from 'next/server'

// `/` answers a health check with a 307 to `/en`; only `/api/*` escapes `middleware.ts`.
// Depends on nothing, so a cache or upstream outage cannot cycle tasks.

export const dynamic = 'force-dynamic'

export const GET = () => NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
