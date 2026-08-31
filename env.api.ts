// Off by default: nothing keeps /api/metrics private until an ALB rule fronts it.
export const METRICS_ENABLED = process.env.METRICS_ENABLED === 'true' || process.env.NODE_ENV === 'development'
