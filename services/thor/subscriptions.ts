'use client'

import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { blockCompressedSchema, transactionIdSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'

/** `/subscriptions/block` frame: the compressed header plus whether it has already been orphaned. */
export const blockBeatSchema = blockCompressedSchema
  .omit({ isTrunk: true, isFinalized: true })
  .extend({ obsolete: z.boolean() })
export type BlockBeat = z.infer<typeof blockBeatSchema>

export const pendingTxSchema = z.object({ id: transactionIdSchema })
export type PendingTx = z.infer<typeof pendingTxSchema>

type SubscriptionPath = 'block' | 'txpool'

const RECONNECT_BASE_MS = 1_000
const RECONNECT_MAX_MS = 30_000

export const subscriptionUrl = (nodeUrl: string, path: SubscriptionPath) => {
  const url = new URL(nodeUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = `${url.pathname.replace(/\/$/, '')}/subscriptions/${path}`
  return url.toString()
}

/**
 * Holds one node WebSocket open for the active network, parsing each frame through `schema` and
 * reconnecting with exponential backoff. Returns whether the socket is currently open.
 */
export const useThorSubscription = <T>({
  path,
  schema,
  onMessage,
  enabled = true,
}: {
  path: SubscriptionPath
  schema: z.ZodType<T>
  onMessage: (message: T) => void
  enabled?: boolean
}) => {
  const nodeUrl = useSettingsStore(state => state.activeNetwork.url)
  const [connected, setConnected] = useState(false)
  const handler = useRef(onMessage)

  useEffect(() => {
    handler.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!enabled || typeof WebSocket === 'undefined') return

    let socket: WebSocket | undefined
    let attempt = 0
    let reconnect: ReturnType<typeof setTimeout> | undefined
    let disposed = false

    const connect = () => {
      socket = new WebSocket(subscriptionUrl(nodeUrl, path))
      socket.onopen = () => {
        attempt = 0
        setConnected(true)
      }
      socket.onmessage = event => {
        let raw: unknown
        try {
          raw = JSON.parse(String(event.data))
        } catch {
          return
        }
        const parsed = schema.safeParse(raw)
        if (parsed.success) handler.current(parsed.data)
      }
      socket.onerror = () => socket?.close()
      socket.onclose = () => {
        setConnected(false)
        if (disposed) return
        reconnect = setTimeout(connect, Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** attempt++))
      }
    }

    connect()

    return () => {
      disposed = true
      clearTimeout(reconnect)
      socket?.close()
    }
  }, [enabled, nodeUrl, path, schema])

  return connected
}

export const useBlockSubscription = (onBlock: (block: BlockBeat) => void, enabled?: boolean) =>
  useThorSubscription({ path: 'block', schema: blockBeatSchema, onMessage: onBlock, enabled })

export const useTxPoolSubscription = (onTx: (tx: PendingTx) => void, enabled?: boolean) =>
  useThorSubscription({ path: 'txpool', schema: pendingTxSchema, onMessage: onTx, enabled })
