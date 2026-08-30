import { renderHook } from '@testing-library/react'
import { encodeAbiParameters, encodeEventTopics, getAddress, toEventSelector } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventType, type HexString, type RawEvent } from '@/lib/schemas'
import { useDecodeEvent } from './useDecodeEvent'

const mocks = vi.hoisted(() => ({ useDecodedSelector: vi.fn() }))

vi.mock('@/services/selector-decoder', () => ({ useDecodedSelector: mocks.useDecodedSelector }))
vi.mock('@/services/sourcify', () => ({ useResolvedAbi: () => ({ data: null, isFetching: false }) }))

const EMITTER = '0x5ef79995fe8a89e0812330e4378eb2660cede699'
const HOLDER = '0x76ca782b59c74d088c7d2cce2f211bc00836c602'

const ERC20_TRANSFER = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false },
  ],
} as const

const erc20TransferLog = (): RawEvent => ({
  address: EMITTER,
  topics: encodeEventTopics({ abi: [ERC20_TRANSFER], args: { from: EMITTER, to: HOLDER } }) as HexString[],
  data: encodeAbiParameters([{ type: 'uint256' }], [1n]) as HexString,
})

const unknownEventLog = (): RawEvent => ({
  address: EMITTER,
  topics: [toEventSelector('SomethingNobodyBundled(uint256)') as HexString],
  data: encodeAbiParameters([{ type: 'uint256' }], [1n]) as HexString,
})

const selectorArgs = () => mocks.useDecodedSelector.mock.calls.at(-1)

describe('useDecodeEvent', () => {
  beforeEach(() => {
    mocks.useDecodedSelector.mockReset()
    mocks.useDecodedSelector.mockReturnValue({ data: null, isFetching: false })
  })

  it('decodes a standard event from the bundled ABIs', () => {
    const { result } = renderHook(() => useDecodeEvent(erc20TransferLog()))

    expect(result.current.event.type).toBe(EventType.DECODED)
    expect(result.current.event).toMatchObject({
      decoded: {
        signature: 'Transfer(address,address,uint256)',
        args: { from: getAddress(EMITTER), to: getAddress(HOLDER), value: '1' },
      },
    })
  })

  it('does not ask the selector decoder about a signature it already has', () => {
    renderHook(() => useDecodeEvent(erc20TransferLog()))

    expect(selectorArgs()).toEqual(['event', null])
  })

  it('still asks about a signature no bundled ABI declares', () => {
    const log = unknownEventLog()

    renderHook(() => useDecodeEvent(log))

    expect(selectorArgs()).toEqual(['event', log.topics[0]])
  })
})
