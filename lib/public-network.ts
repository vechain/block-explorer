import { z } from 'zod'
import { NetworkName } from '@/lib/constants/network'

// Solo is excluded: no third party, Sourcify included, has any notion of it.
const PUBLIC_NETWORKS = [NetworkName.MAINNET, NetworkName.TESTNET] as const

export type PublicNetwork = (typeof PUBLIC_NETWORKS)[number]

const publicNetworkSchema = z.enum(PUBLIC_NETWORKS)

export const isPublicNetwork = (networkName: NetworkName): networkName is PublicNetwork =>
  publicNetworkSchema.safeParse(networkName).success
