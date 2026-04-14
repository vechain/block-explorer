import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/lib/schemas'
import { getPossibleSelectorMismatch } from './transaction-failure-insights'

const buildTransaction = (clauses: Transaction['clauses']): Transaction =>
  ({
    id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    type: 81,
    chainTag: 74,
    blockRef: '0x0000000000000000',
    expiration: 18,
    clauses,
    gas: 100000n,
    maxFeePerGas: 1n,
    maxPriorityFeePerGas: 0n,
    origin: '0x0000000000000000000000000000000000000001',
    dependsOn: null,
    nonce: '0x00000000',
    reserved: null,
    size: 0,
    meta: {
      blockID: '0x0000000000000000000000000000000000000000000000000000000000000000',
      blockNumber: 1,
      blockTimestamp: 1,
    },
  }) as Transaction

describe('getPossibleSelectorMismatch', () => {
  it('flags an early empty revert on the first reverted clause', () => {
    const transaction = buildTransaction([
      {
        to: '0x0000000000000000000000000000000000000002',
        value: 0n,
        data: '0x095ea7b3',
      },
      {
        to: '0x0000000000000000000000000000000000000003',
        value: 0n,
        data: '0x19193c10',
      },
    ])

    const possibleMismatch = getPossibleSelectorMismatch({
      transaction,
      simulations: [
        { reverted: false, gasUsed: 22000, data: '0x01', vmError: '' },
        { reverted: true, gasUsed: 2268, data: '0x', vmError: 'execution reverted' },
      ],
    })

    expect(possibleMismatch).toEqual({
      clauseIndex: 1,
      selector: '0x19193c10',
    })
  })

  it('ignores reverts that return encoded error data', () => {
    const transaction = buildTransaction([
      {
        to: '0x0000000000000000000000000000000000000003',
        value: 0n,
        data: '0x19193c10',
      },
    ])

    const possibleMismatch = getPossibleSelectorMismatch({
      transaction,
      simulations: [{ reverted: true, gasUsed: 2268, data: '0x08c379a0', vmError: 'execution reverted' }],
    })

    expect(possibleMismatch).toBeNull()
  })

  it('ignores reverts that consume substantial gas', () => {
    const transaction = buildTransaction([
      {
        to: '0x0000000000000000000000000000000000000003',
        value: 0n,
        data: '0x19193c10',
      },
    ])

    const possibleMismatch = getPossibleSelectorMismatch({
      transaction,
      simulations: [{ reverted: true, gasUsed: 15000, data: '0x', vmError: 'execution reverted' }],
    })

    expect(possibleMismatch).toBeNull()
  })
})
