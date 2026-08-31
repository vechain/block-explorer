import { NextResponse } from 'next/server'
import { METRICS_ENABLED } from '@/env.api'
import { metricsRegistry } from '@/lib/metrics'

export const dynamic = 'force-dynamic'

// Scraped by the ADOT sidecar over 127.0.0.1 — in `awsvpc` mode it shares the task's
// network namespace, so this never has to cross the load balancer.
export const GET = async () => {
  if (!METRICS_ENABLED) return new NextResponse('Not found', { status: 404 })

  return new NextResponse(await metricsRegistry.metrics(), {
    headers: { 'Content-Type': metricsRegistry.contentType, 'Cache-Control': 'no-store' },
  })
}
