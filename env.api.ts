export const SOURCIFY_URL = process.env.SOURCIFY_URL ?? 'https://sourcify.dev/server'

// Blank when unset: Terraform seeds the secret with a placeholder.
export const INDEXER_RATE_LIMIT_BYPASS = process.env.INDEXER_RATE_LIMIT_BYPASS?.trim()

// Off by default: nothing keeps /api/metrics private until an ALB rule fronts it.
export const METRICS_ENABLED = process.env.METRICS_ENABLED === 'true' || process.env.NODE_ENV === 'development'

// Unset everywhere but ECS, so the proxy caches stay in-process locally and in tests.
export const REDIS_URL = process.env.REDIS_URL?.trim()

// ElastiCache Serverless Valkey only runs in cluster mode; a local Redis does not.
export const REDIS_CLUSTER_MODE = process.env.REDIS_CLUSTER_MODE === 'true'

// The deployed image tag: dev and every preview share one Valkey, so keys carry it.
export const CACHE_NAMESPACE = process.env.CACHE_NAMESPACE?.trim() || 'local'
