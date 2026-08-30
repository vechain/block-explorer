import { toEventSelector, toFunctionSelector } from 'viem'
import { describe, expect, it } from 'vitest'
import type { HexString } from '@/lib/schemas'
import { getBundledEventItem, getBundledFunctionItem } from './index'

const TRANSFER_TOPIC = toEventSelector('Transfer(address,address,uint256)') as HexString
const TRANSFER_SELECTOR = toFunctionSelector('transfer(address,uint256)') as HexString

describe('getBundledFunctionItem', () => {
  it('finds a standard function by its selector', () => {
    expect(getBundledFunctionItem(TRANSFER_SELECTOR)).toMatchObject({
      name: 'transfer',
      inputs: [{ type: 'address' }, { type: 'uint256' }],
    })
  })

  it('is case-insensitive about the selector', () => {
    expect(getBundledFunctionItem(TRANSFER_SELECTOR.toUpperCase().replace('0X', '0x') as HexString)).not.toBeNull()
  })

  it('returns null for a selector no bundled ABI declares', () => {
    expect(getBundledFunctionItem('0xdeadbeef')).toBeNull()
  })
})

describe('getBundledEventItem', () => {
  it('picks the ERC-20 layout for a Transfer with two indexed params', () => {
    const item = getBundledEventItem(TRANSFER_TOPIC, 2)

    expect(item?.inputs.map(input => input.indexed)).toEqual([true, true, false])
  })

  it('picks the ERC-721 layout for the same signature with three', () => {
    const item = getBundledEventItem(TRANSFER_TOPIC, 3)

    expect(item?.inputs.map(input => input.indexed)).toEqual([true, true, true])
  })

  it('returns null when no bundled layout has that many indexed params', () => {
    expect(getBundledEventItem(TRANSFER_TOPIC, 1)).toBeNull()
  })
})
