import {
  createStorage,
  type StorageInputCustom,
  type StorageInputMemory,
  type StorageInterface,
} from 'async-cache-dedupe'
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

// No hash tag: every command here is single-key, and a global tag would pin the whole keyspace to one slot.
const keyPrefix = `${CACHE_NAMESPACE}:`

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

// `getTTL` is the one adapter method with no try/catch of its own, and `stale` runs
// it on every hit — a blip there would reject a hit already in hand. 0 reads as
// expired: the entry is still served, with a refresh behind it.
const failSoftStorage = (client: Redis): StorageInterface => {
  const storage = createStorage('redis', { client })
  const guarded: StorageInterface = Object.create(storage)

  // The library's own type says void; the value is seconds.
  guarded.getTTL = (key: string) => storage.getTTL(key).catch(() => 0) as Promise<void>

  return guarded
}

export const cacheStorage = (size: number): StorageInputCustom | StorageInputMemory => {
  const cache = cacheClient()
  if (!cache) return { type: 'memory', options: { size } }

  // The library types its client as `Redis`; a `Cluster` answers every
  // single-key command it issues.
  return { type: 'custom', options: { storage: failSoftStorage(cache as Redis) } }
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
