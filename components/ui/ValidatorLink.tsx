'use client'

import type { AddressString } from '@/lib/schemas'
import { useValidatorMetadataLookup } from '@/services/veworld-indexer/validator-metadata'
import { CopyableAddressLink } from './Links'

/** A block signer by its registered validator name and logo, or by address when it has none. */
export const ValidatorLink = ({ address, truncate = true }: { address: AddressString; truncate?: boolean }) => {
  const metadata = useValidatorMetadataLookup()(address)
  return <CopyableAddressLink address={address} truncate={truncate} label={metadata?.name} logo={metadata?.logo} />
}
