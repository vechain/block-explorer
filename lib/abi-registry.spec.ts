import type { Abi } from 'viem'
import {
  encodeAbiParameters,
  encodeErrorResult,
  encodeEventTopics,
  encodeFunctionData,
  toEventSelector,
  toFunctionSelector,
} from 'viem'
import { describe, expect, it } from 'vitest'
import {
  decodeCalldata,
  decodeCustomError,
  decodeEventLog,
  decodePanic,
  decodeRevert,
  decodeStringRevert,
  findErrorItem,
  findEventItem,
  findFunctionItem,
  formatArgForDisplay,
  parseSignature,
  SELECTOR_ERROR_STRING,
  SELECTOR_PANIC,
  signatureToEventItem,
  signatureToFunctionItem,
  stringifyValue,
} from './abi-registry'
import type { HexString } from './schemas'

const erc20Abi: Abi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'Transfer',
    anonymous: false,
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'error',
    name: 'InsufficientBalance',
    inputs: [
      { name: 'requested', type: 'uint256' },
      { name: 'available', type: 'uint256' },
    ],
  },
]

const ADDR_A = '0x1111111111111111111111111111111111111111' as const
const ADDR_B = '0x2222222222222222222222222222222222222222' as const

describe('findFunctionItem', () => {
  it('matches a function by its 4-byte selector', () => {
    const selector = toFunctionSelector('transfer(address,uint256)')
    const item = findFunctionItem(erc20Abi, selector)
    expect(item?.name).toBe('transfer')
  })

  it('returns null when no function matches', () => {
    expect(findFunctionItem(erc20Abi, '0xdeadbeef')).toBeNull()
  })
})

describe('findEventItem', () => {
  it('matches an event by topic0', () => {
    const topic0 = toEventSelector('Transfer(address,address,uint256)')
    const item = findEventItem(erc20Abi, topic0)
    expect(item?.name).toBe('Transfer')
  })

  it('skips anonymous events', () => {
    const abi: Abi = [
      {
        type: 'event',
        name: 'Hidden',
        anonymous: true,
        inputs: [],
      },
    ]
    expect(findEventItem(abi, ('0x' + '00'.repeat(32)) as HexString)).toBeNull()
  })
})

describe('findErrorItem', () => {
  it('matches a custom error by its 4-byte selector', () => {
    const selector = toFunctionSelector('InsufficientBalance(uint256,uint256)')
    const item = findErrorItem(erc20Abi, selector)
    expect(item?.name).toBe('InsufficientBalance')
  })
})

describe('decodeCalldata', () => {
  it('decodes a transfer call', () => {
    const calldata = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [ADDR_A, 1234n],
    }) as HexString

    const decoded = decodeCalldata(erc20Abi, calldata)
    expect(decoded?.name).toBe('transfer')
    expect(decoded?.signature).toBe('transfer(address,uint256)')
    // Args get stringified for safe rendering.
    expect(decoded?.args[0]).toBe(ADDR_A)
    expect(decoded?.args[1]).toBe('1234')
  })

  it('returns null for unknown selectors', () => {
    expect(decodeCalldata(erc20Abi, '0xdeadbeef00000000')).toBeNull()
  })
})

describe('decodeEventLog', () => {
  it('decodes a Transfer event with indexed-first layout', () => {
    const topics = encodeEventTopics({
      abi: erc20Abi,
      eventName: 'Transfer',
      args: { from: ADDR_A, to: ADDR_B },
    }) as HexString[]
    const data = encodeAbiParameters([{ type: 'uint256' }], [5000n]) as HexString

    const decoded = decodeEventLog(erc20Abi, { topics, data })
    expect(decoded?.name).toBe('Transfer')
    expect(decoded?.args.from).toBe(ADDR_A.toLowerCase())
    expect(decoded?.args.to).toBe(ADDR_B.toLowerCase())
    expect(decoded?.args.value).toBe('5000')
  })
})

describe('decodeCustomError', () => {
  it('decodes a custom error with args', () => {
    const data = encodeErrorResult({
      abi: erc20Abi,
      errorName: 'InsufficientBalance',
      args: [100n, 50n],
    }) as HexString

    const decoded = decodeCustomError(erc20Abi, data)
    expect(decoded?.kind).toBe('custom')
    expect(decoded?.name).toBe('InsufficientBalance')
    expect(decoded?.args).toEqual(['100', '50'])
  })
})

describe('decodeStringRevert', () => {
  it('decodes Error(string)', () => {
    const msg = 'transfer amount exceeds balance'
    const data = (SELECTOR_ERROR_STRING + encodeAbiParameters([{ type: 'string' }], [msg]).slice(2)) as HexString
    expect(decodeStringRevert(data)).toEqual({ kind: 'string', message: msg })
  })

  it('returns null when not an Error(string)', () => {
    expect(decodeStringRevert('0xdeadbeef')).toBeNull()
  })
})

describe('decodePanic', () => {
  it('decodes Panic(0x11) as arithmetic overflow', () => {
    const data = (SELECTOR_PANIC + encodeAbiParameters([{ type: 'uint256' }], [0x11n]).slice(2)) as HexString
    const decoded = decodePanic(data)
    expect(decoded).toEqual({
      kind: 'panic',
      code: '0x11',
      description: 'arithmetic overflow or underflow',
    })
  })

  it('returns null for non-panic data', () => {
    expect(decodePanic('0x08c379a0')).toBeNull()
  })
})

describe('decodeRevert', () => {
  it('returns empty for "0x"', () => {
    expect(decodeRevert([], '0x')).toEqual({ kind: 'empty' })
  })

  it('returns empty for null', () => {
    expect(decodeRevert([], null)).toEqual({ kind: 'empty' })
  })

  it('routes Error(string) selectors to string decode', () => {
    const data = (SELECTOR_ERROR_STRING + encodeAbiParameters([{ type: 'string' }], ['nope']).slice(2)) as HexString
    expect(decodeRevert(null, data)).toEqual({ kind: 'string', message: 'nope' })
  })

  it('routes Panic selectors to panic decode', () => {
    const data = (SELECTOR_PANIC + encodeAbiParameters([{ type: 'uint256' }], [0x01n]).slice(2)) as HexString
    const result = decodeRevert(null, data)
    expect(result.kind).toBe('panic')
  })

  it('routes other selectors through the supplied ABI for custom-error decode', () => {
    const data = encodeErrorResult({
      abi: erc20Abi,
      errorName: 'InsufficientBalance',
      args: [10n, 5n],
    }) as HexString
    const result = decodeRevert(erc20Abi, data)
    expect(result.kind).toBe('custom')
    if (result.kind === 'custom') expect(result.name).toBe('InsufficientBalance')
  })

  it('falls back to raw when nothing matches', () => {
    expect(decodeRevert(null, '0xdeadbeef')).toEqual({ kind: 'raw', data: '0xdeadbeef' })
  })
})

describe('parseSignature', () => {
  it('handles a plain function signature', () => {
    expect(parseSignature('transfer(address,uint256)')).toEqual({
      name: 'transfer',
      types: ['address', 'uint256'],
    })
  })

  it('handles nested tuples without splitting inside them', () => {
    expect(parseSignature('multicall((address,uint256)[],bytes)')).toEqual({
      name: 'multicall',
      types: ['(address,uint256)[]', 'bytes'],
    })
  })

  it('returns null on garbage input', () => {
    expect(parseSignature('not a signature')).toBeNull()
  })
})

describe('signatureToFunctionItem', () => {
  it('synthesises a function ABI item we can decode against', () => {
    const item = signatureToFunctionItem('transfer(address,uint256)')
    expect(item).not.toBeNull()
    if (!item) return
    const calldata = encodeFunctionData({
      abi: [item],
      functionName: 'transfer',
      args: [ADDR_A, 7n],
    }) as HexString
    const decoded = decodeCalldata([item], calldata)
    expect(decoded?.name).toBe('transfer')
    expect(decoded?.args[1]).toBe('7')
  })
})

describe('signatureToEventItem', () => {
  it('flags the first N params as indexed when indexedFromEnd is false', () => {
    const item = signatureToEventItem('Transfer(address,address,uint256)', 2, false)
    expect(item?.inputs[0].indexed).toBe(true)
    expect(item?.inputs[1].indexed).toBe(true)
    expect(item?.inputs[2].indexed).toBe(false)
  })

  it('flags the last N params as indexed when indexedFromEnd is true', () => {
    const item = signatureToEventItem('Transfer(uint256,address,address)', 2, true)
    expect(item?.inputs[0].indexed).toBe(false)
    expect(item?.inputs[1].indexed).toBe(true)
    expect(item?.inputs[2].indexed).toBe(true)
  })
})

describe('stringifyValue', () => {
  it('converts bigint to string', () => {
    expect(stringifyValue(123n)).toBe('123')
  })

  it('preserves array structure with stringified leaves', () => {
    expect(stringifyValue([1n, 2n])).toEqual(['1', '2'])
  })

  it('preserves object structure with stringified leaves', () => {
    expect(stringifyValue({ a: 1n, b: [2n] })).toEqual({ a: '1', b: ['2'] })
  })
})

describe('formatArgForDisplay', () => {
  it('returns string primitives unchanged', () => {
    expect(formatArgForDisplay('hello')).toBe('hello')
  })

  it('stringifies bigints', () => {
    expect(formatArgForDisplay(42n)).toBe('42')
  })

  it('renders arrays as JSON', () => {
    expect(formatArgForDisplay([1n, 'two'])).toBe('["1","two"]')
  })
})
