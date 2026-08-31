import { collectDefaultMetrics, Registry } from 'prom-client'

// Only `process_*` and `nodejs_*` are left: with the cached proxies gone the app makes no
// upstream calls of its own, and these are what tell AMP the task is alive at all.
const createRegistry = () => {
  const registry = new Registry()
  collectDefaultMetrics({ register: registry })
  return registry
}

interface MetricsGlobal {
  __blockExplorerMetricsRegistry?: Registry
}

// Next builds each route as its own entry, so a module-scope registry would fragment.
const store = globalThis as unknown as MetricsGlobal

export const metricsRegistry = (store.__blockExplorerMetricsRegistry ??= createRegistry())
