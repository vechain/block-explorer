import { describe, expect, it } from 'vitest'
import type { TxFate, TxId } from '@/lib/live-head/store'
import { type Spark, syncSparks } from './draw'

const txId = (n: number): TxId => `0x${n.toString(16).padStart(64, '0')}`

const feed = (pool: TxId[], fates: [TxId, TxFate][] = []) => ({ pool, fates: new Map(fates) })

describe('syncSparks', () => {
  it('spawns one spark per pooled transaction at the hand and leaves it in place on later frames', () => {
    const sparks: Spark[] = []
    syncSparks(sparks, feed([txId(1), txId(2)]), Math.PI)
    expect(sparks.map(spark => spark.id)).toEqual([txId(1), txId(2)])
    expect(sparks[0].angle).toBeCloseTo(Math.PI, 1)

    sparks[0].angle = 0.5
    syncSparks(sparks, feed([txId(1), txId(2), txId(3)]), Math.PI)
    expect(sparks).toHaveLength(3)
    expect(sparks[0].angle).toBe(0.5)
  })

  it('hands a departed spark the fate the feed recorded, defaulting to mined', () => {
    const sparks: Spark[] = []
    syncSparks(sparks, feed([txId(1), txId(2), txId(3)]), 0)

    syncSparks(sparks, feed([txId(3)], [[txId(1), 'dropped']]), 0)
    expect(sparks.map(spark => spark.fate)).toEqual(['dropped', 'mined', 'pending'])
  })

  it('does not respawn a spark whose transaction has departed but is still fading', () => {
    const sparks: Spark[] = []
    syncSparks(sparks, feed([txId(1)]), 0)
    syncSparks(sparks, feed([], [[txId(1), 'mined']]), 0)
    syncSparks(sparks, feed([], [[txId(1), 'mined']]), 0)
    expect(sparks).toHaveLength(1)
    expect(sparks[0].fate).toBe('mined')
  })
})
