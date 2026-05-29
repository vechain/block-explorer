import type { Abi } from 'viem'
import { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import authorityAbi from './abis/authority.json'
import energyAbi from './abis/energy.json'
import executorAbi from './abis/executor.json'
import extensionAbi from './abis/extension.json'
import paramsAbi from './abis/params.json'
import prototypeAbi from './abis/prototype.json'
import stakerAbi from './abis/staker.json'

interface KnownContract {
  name: string
  abi: Abi
}

// Built-in VeChainThor protocol contracts. They live at the same special
// non-CA addresses on every network and aren't deployed via a normal
// contract-creation tx, so Sourcify will never have them.
const BUILTIN: Record<AddressString, KnownContract> = {
  '0x0000000000000000000000417574686f72697479': { name: 'Authority', abi: authorityAbi as Abi },
  '0x0000000000000000000000000000456e65726779': { name: 'VTHO', abi: energyAbi as Abi },
  '0x0000000000000000000000004578656375746f72': { name: 'Executor', abi: executorAbi as Abi },
  '0x0000000000000000000000457874656e73696f6e': { name: 'Extension', abi: extensionAbi as Abi },
  '0x0000000000000000000000000000506172616d73': { name: 'Params', abi: paramsAbi as Abi },
  '0x000000000000000000000050726f746f74797065': { name: 'Prototype', abi: prototypeAbi as Abi },
  '0x00000000000000000000000000005374616b6572': { name: 'Staker', abi: stakerAbi as Abi },
}

// Curated names for well-known VeBetterDAO / Stargate / etc. contracts. Most
// of these are EIP-1967 proxies whose implementation is verified on Sourcify,
// so we let Sourcify provide the ABI and just supply the human-readable name.
const CURATED_NAMES: Record<NetworkName, Record<AddressString, string>> = {
  [NetworkName.MAINNET]: {
    '0x5ef79995fe8a89e0812330e4378eb2660cede699': 'B3TR',
    '0x76ca782b59c74d088c7d2cce2f211bc00836c602': 'VOT3',
    '0x1c65c25fabe2fc1bcb82f253fa0c916a322f777c': 'B3TR Governor',
    '0xdf94739bd169c84fe6478d8420bb807f1f47b135': 'B3TR Emissions',
    '0x93b8cd34a7fc4f53271b9011161f7a2b5fea9d1f': 'Galaxy Member',
    '0x7b7eaf620d88e38782c6491d7ce0b8d8cf3227e4': 'B3TR TimeLock',
    '0xd5903bcc66e439c753e525f8af2fec7be2429593': 'B3TR Treasury',
    '0x838a33af756a6366f93e201423e1425f67ec0fa7': 'Voter Rewards',
    '0x8392b7ccc763db03b47afcd8e8f5e24f9cf0554d': 'X2EarnApps',
    '0x6bee7ddab6c99d5b2af0554eaea484ce18f52631': 'X2EarnRewardsPool',
    '0x4191776f05f4be4848d3f4d587345078b439c7d3': 'XAllocationPool',
    '0x89a00bb0947a30ff95beef77a66aede3842fe5b7': 'XAllocationVoting',
    '0x35a267671d8edd607b2056a9a13e7ba7cf53c8b3': 'VeBetter Passport',
    '0x98c1d097c39969bb5de754266f60d22bd105b368': 'DBA Pool',
    '0x34b56f892c9e977b9ba2e43ba64c27d368ab3c86': 'Relayers Rewards Pool',
    '0xe8e96a768ffd00417d4bd985bec9ecfc6f732a7f': 'X2Earn Creator NFT',
    '0x055d20914657834c914d7c44bf65b566ab4b45a2': 'Grants Manager',
    '0xef238e33fc78ecc79beaf8386254a0fc67d048e0': 'Navigator Registry',
    '0x92a98f23ca4f9703781cf56088b76a1482667166': 'B3TR Challenges',
    '0x1856c533ac2d94340aaa8544d35a5c1d4a21dee7': 'StarGate NFT',
    '0x03c557be98123fdb6fad325328ac6eb77de7248c': 'StarGate Delegation',
    '0xc06ad8573022e2be416ca89da47e8c592971679a': 'Smart Account Factory',
    '0xb81e9c5f9644dec9e5e3cac86b4461a222072302': 'Legacy VeChain Nodes',
    '0x49ec7192bf804abc289645ca86f1ed01a6c17713': 'Oracle (vechain.energy)',
  },
  [NetworkName.TESTNET]: {
    '0x95761346d18244bb91664181bf91193376197088': 'B3TR',
    '0x6e8b4a88d37897fc11f6ba12c805695f1c41f40e': 'VOT3',
    '0xc30b4d0837f7e3706749655d8bde0c0f265dd81b': 'B3TR Governor',
    '0x66898f98409db20ed6a1bf0021334b7897eb0688': 'B3TR Emissions',
    '0x38a59fa7fd7039884465a0ff285b8c4b6fe394ca': 'Galaxy Member',
    '0x835509222aa67c333a1cbf29bd341e014aba86c9': 'B3TR TimeLock',
    '0x3d531a80c05099c71b02585031f86a2988e0caca': 'B3TR Treasury',
    '0x851ef91801899a4e7e4a3174a9300b3e20c957e8': 'Voter Rewards',
    '0x0b54a094b877a25bdc95b4431eaa1e2206b1ddfe': 'X2EarnApps',
    '0x2d2a2207c68a46fc79325d7718e639d1047b0d8b': 'X2EarnRewardsPool',
    '0x6f7b4bc19b4dc99005b473b9c45ce2815bbe7533': 'XAllocationPool',
    '0x8800592c463f0b21ae08732559ee8e146db1d7b2': 'XAllocationVoting',
    '0x15a38b65f26bdbca50addf3865732613a45bbc00': 'Navigator Registry',
    '0x9529916b152357e7e2990c3ce4fe5373d7da54bc': 'B3TR Challenges',
    '0x887d9102f0003f1724d8fd5d4fe95a11572fcd77': 'StarGate NFT',
    '0x1e02b2953adefec225cf0ec49805b1146a4429c1': 'StarGate Delegation',
    '0x713b908bcf77f3e00efef328e50b657a1a23aeaf': 'Smart Account Factory',
    '0x8dbce5de4c1f1840a47ab10c682aee48e9d06c20': 'Legacy VeChain Nodes',
    '0xdccaabd81b38e0deef4c202bc7f1261a4d9192c6': 'Oracle (vechain.energy)',
  },
  [NetworkName.SOLO]: {},
}

const normalize = (address: string): AddressString => address.toLowerCase() as AddressString

function getKnownContract(networkName: NetworkName, address: AddressString | null | undefined): KnownContract | null {
  if (!address) return null
  const key = normalize(address)
  const builtin = BUILTIN[key]
  if (builtin) return builtin
  const curatedName = CURATED_NAMES[networkName]?.[key]
  if (curatedName) return { name: curatedName, abi: [] }
  return null
}

export function getKnownContractName(
  networkName: NetworkName,
  address: AddressString | null | undefined,
): string | null {
  return getKnownContract(networkName, address)?.name ?? null
}

export function getKnownContractAbi(networkName: NetworkName, address: AddressString | null | undefined): Abi | null {
  if (!address) return null
  const key = normalize(address)
  const builtin = BUILTIN[key]
  if (builtin) return builtin.abi
  return null
}

export function isBuiltinAddress(address: AddressString | null | undefined): boolean {
  if (!address) return false
  return normalize(address) in BUILTIN
}
