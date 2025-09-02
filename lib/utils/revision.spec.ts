import { Revision } from '@vechain/sdk-core'
import { describe, expect, it } from 'vitest'
import { parseRevision } from './revision'

describe('Revision utils', () => {
  describe('parseRevision', () => {
    it('should return the revision for a valid revision string', () => {
      const revisionString = '1234567890'
      const revision = parseRevision(revisionString)
      expect(revision).toEqual(Revision.of(revisionString))
    })

    it('should return the revision for a valid revision number', () => {
      const revisionNumber = 123456
      const revision = parseRevision(revisionNumber)
      expect(revision).toEqual(Revision.of(revisionNumber))
    })

    it('should return the revision for the BEST revision', () => {
      const revisionString = Revision.BEST.toString()
      const revision = parseRevision(revisionString)
      expect(revision).toEqual(Revision.BEST)
    })

    it('should return undefined for an invalid revision string', () => {
      const revision = parseRevision('invalidRevision')
      expect(revision).toBeUndefined()
    })

    it('should return undefined for an undefined revision', () => {
      const revision = parseRevision(undefined)
      expect(revision).toBeUndefined()
    })
  })
})
