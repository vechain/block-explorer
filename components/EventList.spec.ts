import { describe, expect, it } from 'vitest'
import { detectErc721Transfer } from './EventList'
import type { DecodedEvent } from '@/hooks/useDecodeEvent'

const makeEvent = (over: Partial<DecodedEvent>): DecodedEvent => ({
  address: '0x0000000000000000000000000000000000000001',
  signature: 'Transfer(address,address,uint256)',
  signatureHash: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  name: 'Transfer',
  inputs: [],
  args: {},
  ...over,
})

describe('detectErc721Transfer', () => {
  it('detects an ERC-721 Transfer (indexed tokenId) and returns the decimal tokenId', () => {
    const event = makeEvent({
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'tokenId', type: 'uint256', indexed: true },
      ],
      args: { from: '0xabc', to: '0xdef', tokenId: 42n },
    })
    expect(detectErc721Transfer(event)).toEqual({ key: 'tokenId', tokenId: '42' })
  })

  it('ignores an ERC-20 Transfer (value is not indexed)', () => {
    const event = makeEvent({
      signature: 'Transfer(address,address,uint256)',
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'value', type: 'uint256', indexed: false },
      ],
      args: { from: '0xabc', to: '0xdef', value: 1000n },
    })
    expect(detectErc721Transfer(event)).toBeNull()
  })

  it('ignores non-Transfer events', () => {
    const event = makeEvent({
      name: 'Approval',
      inputs: [
        { name: 'owner', type: 'address', indexed: true },
        { name: 'approved', type: 'address', indexed: true },
        { name: 'tokenId', type: 'uint256', indexed: true },
      ],
      args: { owner: '0xabc', approved: '0xdef', tokenId: 7n },
    })
    expect(detectErc721Transfer(event)).toBeNull()
  })

  it('handles unnamed indexed tokenId by falling back to its index as the key', () => {
    const event = makeEvent({
      inputs: [
        { name: '', type: 'address', indexed: true },
        { name: '', type: 'address', indexed: true },
        { name: '', type: 'uint256', indexed: true },
      ],
      args: { '0': '0xabc', '1': '0xdef', '2': 99n },
    })
    expect(detectErc721Transfer(event)).toEqual({ key: '2', tokenId: '99' })
  })
})
