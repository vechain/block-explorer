import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client'

const PREFIX = 'block_explorer_'

// The last bucket is the upstream timeout, so it is a ceiling rather than a tail.
const UPSTREAM_DURATION_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]

const createMetrics = () => {
  const registry = new Registry()
  // Left unprefixed so `process_*` and `nodejs_*` keep the names every dashboard expects.
  collectDefaultMetrics({ register: registry })

  return {
    registry,

    cacheRequests: new Counter({
      name: `${PREFIX}cache_requests_total`,
      help: 'Cached-proxy lookups by outcome.',
      labelNames: ['name', 'path', 'result'] as const,
      registers: [registry],
    }),

    // Covers both a miss fill and a background stale refresh; subtracting the miss count
    // from this is how the stale-refresh rate is read.
    upstreamRequests: new Counter({
      name: `${PREFIX}upstream_requests_total`,
      help: 'Upstream fetches issued by the cached proxy, by outcome.',
      labelNames: ['name', 'path', 'outcome'] as const,
      registers: [registry],
    }),

    upstreamDuration: new Histogram({
      name: `${PREFIX}upstream_duration_seconds`,
      help: 'Upstream fetch duration in seconds.',
      labelNames: ['name', 'path'] as const,
      buckets: UPSTREAM_DURATION_BUCKETS,
      registers: [registry],
    }),

    httpResponses: new Counter({
      name: `${PREFIX}http_responses_total`,
      help: 'Cached-proxy responses by matched route template and status.',
      labelNames: ['route', 'status'] as const,
      registers: [registry],
    }),
  }
}

interface MetricsGlobal {
  __blockExplorerMetrics?: ReturnType<typeof createMetrics>
}

// Next builds each route as its own entry, so a module-scope registry would fragment.
const store = globalThis as unknown as MetricsGlobal

export const metrics = (store.__blockExplorerMetrics ??= createMetrics())
