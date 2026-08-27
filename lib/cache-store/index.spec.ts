// @vitest-environment node
// async-cache-dedupe refuses its Redis storage when `window` is defined, so the
// shared-cache paths are only reachable from a server environment.
import { createCache, type StorageInterface } from 'async-cache-dedupe'
import { afterEach, describe, expect, it, vi } from 'vitest'

const NOT_FOUND = { name: 'thor_blocks', ttl: 10, size: 256 }

const client = {
  get: vi.fn().mockResolvedValue(null),
  exists: vi.fn().mockResolvedValue(0),
  set: vi.fn().mockResolvedValue('OK'),
  pttl: vi.fn().mockResolvedValue(-2),
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

const storageOf = (input: { type: string; options?: unknown }) => {
  if (input.type !== 'custom') throw new Error(`expected a shared store, got '${input.type}'`)
  return (input.options as { storage: StorageInterface }).storage
}

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

    await storageOf(cacheStorage(500)).exists('a-key')

    expect(client.exists).toHaveBeenCalledWith('a-key')
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

    expect(namespacedCacheName('indexer_transactions')).toBe('dev-v.1.2.3:indexer_transactions')
  })

  // A global hash tag would put every key in one slot, and one shard.
  it('leaves keys free to distribute across cluster slots', async () => {
    const { namespacedCacheName } = await withRedis()

    expect(namespacedCacheName('indexer_transactions')).not.toContain('{')
  })

  describe('the TTL probe behind a stale serve', () => {
    // Every endpoint sets `stale`, so the probe runs on each hit. Driven through the
    // real factory because a store it rejects would throw at route module load.
    const serveHit = async () => {
      const { cacheStorage } = await withRedis()
      const cache = createCache({ storage: cacheStorage(500) }).define(
        'probe',
        { ttl: 60, stale: 30 },
        async (_params: { id: string }) => ({ from: 'upstream' }),
      )

      client.get.mockResolvedValueOnce(JSON.stringify({ from: 'cache' }))

      return cache.probe({ id: 'a' })
    }

    it('serves a hit out of the shared store', async () => {
      await expect(serveHit()).resolves.toEqual({ from: 'cache' })
    })

    // Unguarded in the library: a rejection here would turn a hit already in hand
    // into a 500.
    it('still serves the hit when the probe itself fails', async () => {
      client.pttl.mockRejectedValueOnce(new Error('ECONNRESET'))

      await expect(serveHit()).resolves.toEqual({ from: 'cache' })
    })

    it('reports the remaining lifetime in seconds', async () => {
      const { cacheStorage } = await withRedis()
      client.pttl.mockResolvedValueOnce(4_500)

      await expect(storageOf(cacheStorage(500)).getTTL('a-key')).resolves.toBe(5)
    })

    it('degrades to expired when the cache cannot answer', async () => {
      const { cacheStorage } = await withRedis()
      client.pttl.mockRejectedValueOnce(new Error('ECONNRESET'))

      await expect(storageOf(cacheStorage(500)).getTTL('a-key')).resolves.toBe(0)
    })
  })

  describe('negative caches', () => {
    it('records a definitive miss with a seconds TTL, under its own namespaced key', async () => {
      const { createMissCache } = await withRedis()

      await createMissCache(NOT_FOUND).add('revision=1')

      expect(client.set).toHaveBeenCalledWith('dev-v.1.2.3:miss:thor_blocks~revision=1', '1', 'EX', 10)
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
