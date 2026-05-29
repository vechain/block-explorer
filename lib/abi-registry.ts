// Pure ABI helpers for matching items against selectors / topic0s and
// decoding calldata, event logs, custom errors, and Solidity panics.
//
// Used by the address-aware decoding hooks (`useDecodeInputData`,
// `useDecodeEvent`) and by the server-side revert-decoding in
// `services/thor/transaction.ts`.

import type { Abi, AbiEvent, AbiFunction, AbiParameter } from 'viem'
import { decodeAbiParameters, decodeErrorResult, slice, toEventSelector, toFunctionSelector } from 'viem'
import type { HexString } from '@/lib/schemas'

// `AbiError` is exported by abitype but not re-exported by viem at the top
// level. Derive it from viem's `Abi` so we don't need a transitive dep.
type AbiError = Extract<Abi[number], { type: 'error' }>

export const SELECTOR_ERROR_STRING = '0x08c379a0' as const // Error(string)
export const SELECTOR_PANIC = '0x4e487b71' as const // Panic(uint256)

const PANIC_CODES: Record<number, string> = {
  0x00: 'generic compiler-inserted panic',
  0x01: 'assert failed',
  0x11: 'arithmetic overflow or underflow',
  0x12: 'division or modulo by zero',
  0x21: 'invalid enum conversion',
  0x22: 'incorrectly encoded storage byte array',
  0x31: '.pop() on empty array',
  0x32: 'array index out of bounds',
  0x41: 'out of memory (oversized allocation)',
  0x51: 'invalid internal function call',
}

export const getSelector = (calldata: HexString): HexString | null => {
  if (!calldata || calldata.length < 10) return null
  return slice(calldata, 0, 4)
}

// React can't render bigints, objects, or arrays directly. Walk decoded
// values once and convert to strings (preserving structure) so the existing
// table renderers don't need to know about decoded types. JSON.stringify
// would collapse the structure into a single cell — we want each element
// to remain individually renderable.
export const stringifyValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'boolean') return value.toString()
  if (Array.isArray(value)) return value.map(stringifyValue)
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = stringifyValue(v)
    }
    return out
  }
  return value
}

const stringifyArgsArray = (args: readonly unknown[]): readonly unknown[] => args.map(stringifyValue)

const stringifyArgsRecord = (args: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(args)) out[k] = stringifyValue(v)
  return out
}

// Coerces a decoded arg into a React-renderable string. Used by table
// cells so arrays / structs / nested tuples render as readable JSON-ish
// blobs instead of crashing the renderer.
export const formatArgForDisplay = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  try {
    return JSON.stringify(stringifyValue(value))
  } catch {
    return String(value)
  }
}

const safeFunctionSelector = (item: AbiFunction): HexString | null => {
  try {
    return toFunctionSelector(item)
  } catch {
    return null
  }
}

const safeEventTopic = (item: AbiEvent): HexString | null => {
  try {
    return toEventSelector(item)
  } catch {
    return null
  }
}

const safeErrorSelector = (item: AbiError): HexString | null => {
  try {
    // Errors share the function-selector encoding scheme.
    return toFunctionSelector({ ...item, type: 'function', outputs: [] } as unknown as AbiFunction)
  } catch {
    return null
  }
}

export const findFunctionItem = (abi: Abi, selector: HexString): AbiFunction | null => {
  const needle = selector.toLowerCase()
  for (const item of abi) {
    if (item.type !== 'function') continue
    const sel = safeFunctionSelector(item)
    if (sel && sel.toLowerCase() === needle) return item
  }
  return null
}

export const findEventItem = (abi: Abi, topic0: HexString): AbiEvent | null => {
  const needle = topic0.toLowerCase()
  for (const item of abi) {
    if (item.type !== 'event' || item.anonymous) continue
    const sig = safeEventTopic(item)
    if (sig && sig.toLowerCase() === needle) return item
  }
  return null
}

export const findErrorItem = (abi: Abi, selector: HexString): AbiError | null => {
  const needle = selector.toLowerCase()
  for (const item of abi) {
    if (item.type !== 'error') continue
    const sel = safeErrorSelector(item)
    if (sel && sel.toLowerCase() === needle) return item
  }
  return null
}

interface DecodedCalldata {
  signature: string
  signatureHash: HexString
  name: string
  inputs: readonly AbiParameter[]
  args: readonly unknown[]
}

interface DecodedEvent {
  signature: string
  signatureHash: HexString
  name: string
  inputs: AbiEvent['inputs']
  args: Record<string, unknown>
}

interface DecodedCustomError {
  kind: 'custom'
  signature: string
  signatureHash: HexString
  name: string
  inputs: readonly AbiParameter[]
  args: readonly unknown[]
}

interface DecodedStringRevert {
  kind: 'string'
  message: string
}

interface DecodedPanic {
  kind: 'panic'
  code: HexString
  description: string
}

interface RawRevert {
  kind: 'raw'
  data: HexString
}

interface EmptyRevert {
  kind: 'empty'
}

type DecodedRevert = DecodedCustomError | DecodedStringRevert | DecodedPanic | RawRevert | EmptyRevert

const formatAbiItem = (item: AbiFunction | AbiEvent | AbiError): string => {
  const inputs = (item.inputs ?? []) as readonly AbiParameter[]
  const types = inputs.map(p => p.type).join(',')
  return `${item.name}(${types})`
}

export const decodeCalldata = (abi: Abi, calldata: HexString): DecodedCalldata | null => {
  const selector = getSelector(calldata)
  if (!selector) return null
  const item = findFunctionItem(abi, selector)
  if (!item) return null
  const argsHex = ('0x' + calldata.slice(10)) as HexString
  try {
    const args = item.inputs.length ? decodeAbiParameters(item.inputs, argsHex) : []
    return {
      signature: formatAbiItem(item),
      signatureHash: selector,
      name: item.name,
      inputs: item.inputs,
      args: stringifyArgsArray(args),
    }
  } catch {
    return null
  }
}

export const decodeEventLog = (abi: Abi, rawEvent: { topics: HexString[]; data: HexString }): DecodedEvent | null => {
  const topic0 = rawEvent.topics[0]
  if (!topic0) return null
  const item = findEventItem(abi, topic0)
  if (!item) return null
  try {
    const indexedParams = item.inputs.filter(p => p.indexed)
    const dataParams = item.inputs.filter(p => !p.indexed)
    const decodedIndexed = indexedParams.length
      ? indexedParams.map((p, i) => {
          const topic = rawEvent.topics[i + 1]
          if (!topic) return undefined
          try {
            return decodeAbiParameters([p], topic)[0]
          } catch {
            return topic
          }
        })
      : []
    const decodedData =
      dataParams.length && rawEvent.data && rawEvent.data !== '0x' ? decodeAbiParameters(dataParams, rawEvent.data) : []

    const args: Record<string, unknown> = {}
    let iIdx = 0
    let dIdx = 0
    item.inputs.forEach((p, i) => {
      const key = p.name && p.name.length > 0 ? p.name : String(i)
      if (p.indexed) {
        args[key] = decodedIndexed[iIdx++]
      } else {
        args[key] = decodedData[dIdx++]
      }
    })

    return {
      signature: formatAbiItem(item),
      signatureHash: topic0,
      name: item.name,
      inputs: item.inputs,
      args: stringifyArgsRecord(args),
    }
  } catch {
    return null
  }
}

export const decodeCustomError = (abi: Abi, errorData: HexString): DecodedCustomError | null => {
  const selector = getSelector(errorData)
  if (!selector) return null
  const item = findErrorItem(abi, selector)
  if (!item) return null
  try {
    // Prefer viem's helper since it handles both args and naming.
    const decoded = decodeErrorResult({ abi: [item], data: errorData })
    return {
      kind: 'custom',
      signature: formatAbiItem(item),
      signatureHash: selector,
      name: item.name,
      inputs: item.inputs,
      args: stringifyArgsArray((decoded.args ?? []) as readonly unknown[]),
    }
  } catch {
    // Fall back to manual arg decode if viem refuses (e.g. malformed args).
    try {
      const argsHex = ('0x' + errorData.slice(10)) as HexString
      const args = item.inputs.length ? decodeAbiParameters(item.inputs, argsHex) : []
      return {
        kind: 'custom',
        signature: formatAbiItem(item),
        signatureHash: selector,
        name: item.name,
        inputs: item.inputs,
        args: stringifyArgsArray(args),
      }
    } catch {
      return null
    }
  }
}

export const decodePanic = (errorData: HexString): DecodedPanic | null => {
  const selector = getSelector(errorData)
  if (!selector || selector.toLowerCase() !== SELECTOR_PANIC) return null
  try {
    const argsHex = ('0x' + errorData.slice(10)) as HexString
    const [code] = decodeAbiParameters([{ type: 'uint256' } as AbiParameter], argsHex) as [bigint]
    const numericCode = Number(code)
    const codeHex = ('0x' + numericCode.toString(16).padStart(2, '0')) as HexString
    return {
      kind: 'panic',
      code: codeHex,
      description: PANIC_CODES[numericCode] ?? 'unknown panic code',
    }
  } catch {
    return null
  }
}

export const decodeStringRevert = (errorData: HexString): DecodedStringRevert | null => {
  const selector = getSelector(errorData)
  if (!selector || selector.toLowerCase() !== SELECTOR_ERROR_STRING) return null
  try {
    const argsHex = ('0x' + errorData.slice(10)) as HexString
    const [message] = decodeAbiParameters([{ type: 'string' } as AbiParameter], argsHex) as [string]
    return { kind: 'string', message }
  } catch {
    return null
  }
}

export const decodeRevert = (abi: Abi | null, errorData: HexString | null | undefined): DecodedRevert => {
  if (!errorData || errorData === '0x') return { kind: 'empty' }
  if (errorData.length < 10) return { kind: 'raw', data: errorData }
  const selector = getSelector(errorData)!.toLowerCase()
  if (selector === SELECTOR_ERROR_STRING) {
    return decodeStringRevert(errorData) ?? { kind: 'raw', data: errorData }
  }
  if (selector === SELECTOR_PANIC) {
    return decodePanic(errorData) ?? { kind: 'raw', data: errorData }
  }
  if (abi) {
    const custom = decodeCustomError(abi, errorData)
    if (custom) return custom
  }
  return { kind: 'raw', data: errorData }
}

// Splits a comma-separated arg list at the top level, respecting nested
// tuples / arrays. `address,(uint256,uint256)[],bytes` -> three parts.
const splitTopLevel = (s: string): string[] => {
  const out: string[] = []
  let depth = 0
  let current = ''
  for (const ch of s) {
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    if (ch === ',' && depth === 0) {
      const trimmed = current.trim()
      if (trimmed) out.push(trimmed)
      current = ''
    } else {
      current += ch
    }
  }
  const tail = current.trim()
  if (tail) out.push(tail)
  return out
}

export const parseSignature = (sig: string): { name: string; types: string[] } | null => {
  const m = sig.match(/^([^\s(]+)\((.*)\)$/)
  if (!m) return null
  const name = m[1]
  const argsStr = m[2]
  if (!argsStr) return { name, types: [] }
  return { name, types: splitTopLevel(argsStr) }
}

export const signatureToFunctionItem = (sig: string): AbiFunction | null => {
  const parsed = parseSignature(sig)
  if (!parsed) return null
  return {
    type: 'function',
    name: parsed.name,
    stateMutability: 'nonpayable',
    inputs: parsed.types.map((type, i) => ({ name: `arg${i}`, type })),
    outputs: [],
  }
}

export const signatureToEventItem = (sig: string, numIndexed: number, indexedFromEnd = false): AbiEvent | null => {
  const parsed = parseSignature(sig)
  if (!parsed) return null
  const n = parsed.types.length
  if (numIndexed > n) return null
  const indexedAt = new Set<number>()
  if (indexedFromEnd) {
    for (let i = n - numIndexed; i < n; i++) indexedAt.add(i)
  } else {
    for (let i = 0; i < numIndexed; i++) indexedAt.add(i)
  }
  return {
    type: 'event',
    name: parsed.name,
    anonymous: false,
    inputs: parsed.types.map((type, i) => ({
      name: `arg${i}`,
      type,
      indexed: indexedAt.has(i),
    })),
  }
}
