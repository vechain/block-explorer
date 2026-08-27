import type { StorageInputMemory, StorageInputRedis } from 'async-cache-dedupe'
import Redis, { Cluster, type RedisOptions } from 'ioredis'
import { LRUCache } from 'lru-cache'
import { CACHE_NAMESPACE, REDIS_CLUSTER_MODE, REDIS_URL } from '@/env.api'

/** Stores behind the cached proxy: a shared Valkey where one is configured, per-task memory otherwise. */

// A lookup has to fail fast — an unreachable cache must degrade to an upstream
// fetch rather than add its own latency to every request.
const NODE_OPTIONS: RedisOptions = {
  connectTimeout: 3_000,
  commandTimeout: 1_000,
  maxRetriesPerRequest: 1,
}

// `{be}` is a hash tag: one cluster slot for every key, so no multi-key command added here can CROSSSLOT.
const keyPrefix = `{be}:${CACHE_NAMESPACE}:`

// A cluster client takes credentials and TLS from its options, not from the URL.
const createClusterClient = (url: string) => {
  const { hostname, port, username, password, protocol } = new URL(url)

  return new Cluster([{ host: hostname, port: Number(port) || 6379 }], {
    enableOfflineQueue: false,
    redisOptions: {
      ...NODE_OPTIONS,
      username: decodeURIComponent(username) || undefined,
      password: decodeURIComponent(password) || undefined,
      ...(protocol === 'rediss:' ? { tls: {} } : {}),
    },
    // Resolves nothing: the names the cluster advertises have to reach TLS as
    // names, or certificate verification fails against the resolved address.
    dnsLookup: (address, callback) => callback(null, address),
  })
}

const createClient = () => {
  if (!REDIS_URL) return null

  const client = REDIS_CLUSTER_MODE
    ? createClusterClient(REDIS_URL)
    : new Redis(REDIS_URL, { ...NODE_OPTIONS, enableOfflineQueue: false })

  // ioredis turns an `error` event with no listener into an uncaught exception.
  client.on('error', error => console.error('Cache client error:', error.message))

  return client
}

let client: Redis | Cluster | null | undefined

const cacheClient = () => {
  if (client === undefined) client = createClient()
  return client
}

/** Prefixes an async-cache-dedupe namespace, which is what its storage keys are built from. */
export const namespacedCacheName = (name: string) => `${keyPrefix}${name}`

export const cacheStorage = (size: number): StorageInputRedis | StorageInputMemory => {
  const cache = cacheClient()
  // The library types its client as `Redis`; a `Cluster` answers every
  // single-key command it issues.
  return cache ? { type: 'redis', options: { client: cache as Redis } } : { type: 'memory', options: { size } }
}

export interface MissCache {
  has: (key: string) => Promise<boolean>
  add: (key: string) => Promise<void>
}

// Hand-rolled onto single-key SET/EXISTS: async-cache-dedupe has no Redis backend
// for negative caches. Its TTLs are seconds; LRUCache's are milliseconds.
export const createMissCache = ({ name, ttl, size }: { name: string; ttl: number; size: number }): MissCache => {
  const cache = cacheClient()

  if (!cache) {
    const entries = new LRUCache<string, true>({ max: size, ttl: ttl * 1_000 })
    return {
      has: async key => entries.has(key),
      add: async key => {
        entries.set(key, true)
      },
    }
  }

  const storageKey = (key: string) => `${keyPrefix}miss:${name}~${key}`

  return {
    // A cache that cannot answer is a miss: never a 404 nothing verified.
    has: key =>
      cache
        .exists(storageKey(key))
        .then(count => count > 0)
        .catch(() => false),
    add: key =>
      cache
        .set(storageKey(key), '1', 'EX', ttl)
        .then(() => undefined)
        .catch(() => undefined),
  }
}
