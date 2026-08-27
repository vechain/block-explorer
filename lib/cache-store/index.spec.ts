import { afterEach, describe, expect, it, vi } from 'vitest'

const NOT_FOUND = { name: 'thor_blocks', ttl: 10, size: 256 }

const client = {
  exists: vi.fn().mockResolvedValue(0),
  set: vi.fn().mockResolvedValue('OK'),
  on: vi.fn(),
}

type ClusterArgs = [{ host: string; port: number }[], { redisOptions: Record<string, unknown> }]

const Redis = vi.fn(() => client)
const Cluster = vi.fn((..._args: ClusterArgs) => client)

const loadStore = async (env: { REDIS_URL?: string; REDIS_CLUSTER_MODE?: boolean }) => {
  vi.resetModules()
  vi.doMock('ioredis', () => ({ default: Redis, Cluster }))
  vi.doMock('@/env.api', () => ({
    REDIS_URL: env.REDIS_URL,
    REDIS_CLUSTER_MODE: env.REDIS_CLUSTER_MODE ?? false,
    CACHE_NAMESPACE: 'dev-v.1.2.3',
  }))

  return import('./index')
}

const withRedis = () => loadStore({ REDIS_URL: 'redis://cache.test:6379' })

describe('cache store', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.doUnmock('ioredis')
    vi.doUnmock('@/env.api')
  })

  it('keeps every store in memory when no cache is configured', async () => {
    const { cacheStorage } = await loadStore({})

    expect(cacheStorage(500)).toEqual({ type: 'memory', options: { size: 500 } })
    expect(Redis).not.toHaveBeenCalled()
  })

  it('backs the hit stores with the shared cache when one is configured', async () => {
    const { cacheStorage } = await withRedis()

    expect(cacheStorage(500)).toEqual({ type: 'redis', options: { client } })
  })

  it('opens one connection for every store', async () => {
    const { cacheStorage, createMissCache } = await withRedis()

    cacheStorage(500)
    cacheStorage(500)
    createMissCache(NOT_FOUND)

    expect(Redis).toHaveBeenCalledTimes(1)
  })

  it('namespaces keys by build, so a shared cache cannot serve another payload shape', async () => {
    const { namespacedCacheName } = await withRedis()

    expect(namespacedCacheName('indexer_transactions')).toBe('{be}:dev-v.1.2.3:indexer_transactions')
  })

  it('records a definitive miss with a seconds TTL, under its own namespaced key', async () => {
    const { createMissCache } = await withRedis()

    await createMissCache(NOT_FOUND).add('revision=1')

    expect(client.set).toHaveBeenCalledWith('{be}:dev-v.1.2.3:miss:thor_blocks~revision=1', '1', 'EX', 10)
  })

  it('reads a recorded miss back', async () => {
    const { createMissCache } = await withRedis()
    client.exists.mockResolvedValueOnce(1)

    await expect(createMissCache(NOT_FOUND).has('revision=1')).resolves.toBe(true)
  })

  it('treats an unreachable cache as a miss rather than an unverified 404', async () => {
    const { createMissCache } = await withRedis()
    client.exists.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    client.set.mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const missCache = createMissCache(NOT_FOUND)

    await expect(missCache.has('revision=1')).resolves.toBe(false)
    await expect(missCache.add('revision=1')).resolves.toBeUndefined()
  })

  it('records a definitive miss in memory when there is no shared cache', async () => {
    const { createMissCache } = await loadStore({})
    const missCache = createMissCache(NOT_FOUND)

    await expect(missCache.has('revision=1')).resolves.toBe(false)
    await missCache.add('revision=1')

    await expect(missCache.has('revision=1')).resolves.toBe(true)
  })

  it('converts the TTL to milliseconds for the in-memory cache, which takes no seconds', async () => {
    const LRUCache = vi.fn()
    vi.doMock('lru-cache', () => ({ LRUCache }))

    const { createMissCache } = await loadStore({})
    createMissCache(NOT_FOUND)

    expect(LRUCache).toHaveBeenCalledWith({ max: NOT_FOUND.size, ttl: NOT_FOUND.ttl * 1_000 })
    vi.doUnmock('lru-cache')
  })

  describe('cluster mode', () => {
    it('takes the credentials and TLS from the URL, which a cluster client ignores', async () => {
      const { cacheStorage } = await loadStore({
        REDIS_URL: 'rediss://app:s3cret@cache.test:6379',
        REDIS_CLUSTER_MODE: true,
      })

      cacheStorage(500)

      const [nodes, options] = Cluster.mock.calls[0]

      expect(nodes).toEqual([{ host: 'cache.test', port: 6379 }])
      expect(options.redisOptions).toMatchObject({ username: 'app', password: 's3cret', tls: {} })
    })
  })
})
