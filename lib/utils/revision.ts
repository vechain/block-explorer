import { type Hex, Revision } from '@vechain/sdk-core'

type RevisionValueParam = bigint | number | string | Uint8Array | Hex

/**
 * Parses a revision from a string, number, bigint, Uint8Array, or Hex
 * @param value
 * @returns The parsed revision or undefined if the value is invalid
 */
export const parseRevision = (value: RevisionValueParam | undefined): Revision | undefined => {
  if (!value) return undefined

  try {
    return Revision.of(value)
  } catch (_error) {
    return undefined
  }
}
