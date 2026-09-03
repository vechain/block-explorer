import { useSyncExternalStore } from 'react'

const listeners = new Set<() => void>()
let nowSeconds = Math.floor(Date.now() / 1000)
let timer: ReturnType<typeof setInterval> | undefined

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  timer ??= setInterval(() => {
    nowSeconds = Math.floor(Date.now() / 1000)
    listeners.forEach(notify => notify())
  }, 1000)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

const getSnapshot = () => nowSeconds

/** The current Unix time in whole seconds, shared across subscribers on one 1 Hz tick. */
export const useNowSeconds = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
