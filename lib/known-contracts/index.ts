import type { Abi } from 'viem'
import { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'

// Protocol built-ins (same address on every network, not on Sourcify).
import authorityAbi from './abis/authority.json'
import energyAbi from './abis/energy.json'
import executorAbi from './abis/executor.json'
import extensionAbi from './abis/extension.json'
import paramsAbi from './abis/params.json'
import prototypeAbi from './abis/prototype.json'
import stakerAbi from './abis/staker.json'

// VeBetterDAO / Stargate / friends. b32 keeps these per contract name; we
// bundle them and map per-network addresses to a name → ABI lookup so the
// same ABI works for mainnet and testnet deployments.
import b3trAbi from './abis/b3tr.json'
import b3trChallengesAbi from './abis/b3tr-challenges.json'
import b3trGovernorAbi from './abis/b3tr-governor.json'
import b3trTimelockAbi from './abis/b3tr-timelock.json'
import b3trTreasuryAbi from './abis/b3tr-treasury.json'
import dbaPoolAbi from './abis/dba-pool.json'
import emissionsAbi from './abis/emissions.json'
import galaxyMemberAbi from './abis/galaxy-member.json'
import grantsManagerAbi from './abis/grants-manager.json'
import legacyVechainNodesAbi from './abis/legacy-vechain-nodes.json'
import multiSigWalletAbi from './abis/multi-sig-wallet.json'
import navigatorRegistryAbi from './abis/navigator-registry.json'
import nodeManagementAbi from './abis/node-management.json'
import oracleVechainEnergyAbi from './abis/oracle-vechain-energy.json'
import relayersRewardsPoolAbi from './abis/relayers-rewards-pool.json'
import smartAccountFactoryAbi from './abis/smart-account-factory.json'
import stargateDelegationAbi from './abis/stargate-delegation.json'
import stargateNftAbi from './abis/stargate-nft.json'
import vebetterPassportAbi from './abis/vebetter-passport.json'
import vot3Abi from './abis/vot3.json'
import voterRewardsAbi from './abis/voter-rewards.json'
import x2earnAppsAbi from './abis/x2earn-apps.json'
import x2earnCreatorAbi from './abis/x2earn-creator.json'
import x2earnRewardsPoolAbi from './abis/x2earn-rewards-pool.json'
import xAllocationPoolAbi from './abis/x-allocation-pool.json'
import xAllocationVotingAbi from './abis/x-allocation-voting.json'

// Community-curated name registry crawled from vechainstats.com/contracts/
// (top 500 by clauses / VTHO burned / CO2e / new + verified). Mainnet only;
// vechainstats doesn't ship a testnet equivalent. Names cover apps and
// DEXes that aren't in vechain/token-registry or our curated list, but
// the dataset is name-only — ABIs are still resolved via Sourcify.
import vechainstatsNamesRaw from './vechainstats-names.json'

interface KnownContract {
  name: string
  abi: Abi
}

// Built-in VeChainThor protocol contracts — live at the same non-CA address
// on every network and aren't deployed by a regular tx, so Sourcify never
// has them. Address keys are lowercase.
const BUILTIN: Record<AddressString, KnownContract> = {
  '0x0000000000000000000000417574686f72697479': { name: 'Authority', abi: authorityAbi as Abi },
  '0x0000000000000000000000000000456e65726779': { name: 'VTHO', abi: energyAbi as Abi },
  '0x0000000000000000000000004578656375746f72': { name: 'Executor', abi: executorAbi as Abi },
  '0x0000000000000000000000457874656e73696f6e': { name: 'Extension', abi: extensionAbi as Abi },
  '0x0000000000000000000000000000506172616d73': { name: 'Params', abi: paramsAbi as Abi },
  '0x000000000000000000000050726f746f74797065': { name: 'Prototype', abi: prototypeAbi as Abi },
  '0x00000000000000000000000000005374616b6572': { name: 'Staker', abi: stakerAbi as Abi },
}

// Curated VeBetterDAO / Stargate contracts. The name-to-ABI map is global;
// per-network deployment addresses live below.
const CURATED_ABIS_BY_NAME: Record<string, KnownContract> = {
  B3TR: { name: 'B3TR', abi: b3trAbi as Abi },
  VOT3: { name: 'VOT3', abi: vot3Abi as Abi },
  'B3TR Governor': { name: 'B3TR Governor', abi: b3trGovernorAbi as Abi },
  'B3TR Emissions': { name: 'B3TR Emissions', abi: emissionsAbi as Abi },
  'Galaxy Member': { name: 'Galaxy Member', abi: galaxyMemberAbi as Abi },
  'B3TR TimeLock': { name: 'B3TR TimeLock', abi: b3trTimelockAbi as Abi },
  'B3TR Treasury': { name: 'B3TR Treasury', abi: b3trTreasuryAbi as Abi },
  'Voter Rewards': { name: 'Voter Rewards', abi: voterRewardsAbi as Abi },
  X2EarnApps: { name: 'X2EarnApps', abi: x2earnAppsAbi as Abi },
  X2EarnRewardsPool: { name: 'X2EarnRewardsPool', abi: x2earnRewardsPoolAbi as Abi },
  XAllocationPool: { name: 'XAllocationPool', abi: xAllocationPoolAbi as Abi },
  XAllocationVoting: { name: 'XAllocationVoting', abi: xAllocationVotingAbi as Abi },
  'VeBetter Passport': { name: 'VeBetter Passport', abi: vebetterPassportAbi as Abi },
  'DBA Pool': { name: 'DBA Pool', abi: dbaPoolAbi as Abi },
  'Relayers Rewards Pool': { name: 'Relayers Rewards Pool', abi: relayersRewardsPoolAbi as Abi },
  'X2Earn Creator NFT': { name: 'X2Earn Creator NFT', abi: x2earnCreatorAbi as Abi },
  'Grants Manager': { name: 'Grants Manager', abi: grantsManagerAbi as Abi },
  'Navigator Registry': { name: 'Navigator Registry', abi: navigatorRegistryAbi as Abi },
  'B3TR Challenges': { name: 'B3TR Challenges', abi: b3trChallengesAbi as Abi },
  'StarGate NFT': { name: 'StarGate NFT', abi: stargateNftAbi as Abi },
  'StarGate Delegation': { name: 'StarGate Delegation', abi: stargateDelegationAbi as Abi },
  'Smart Account Factory': { name: 'Smart Account Factory', abi: smartAccountFactoryAbi as Abi },
  'Legacy VeChain Nodes': { name: 'Legacy VeChain Nodes', abi: legacyVechainNodesAbi as Abi },
  'Oracle (vechain.energy)': { name: 'Oracle (vechain.energy)', abi: oracleVechainEnergyAbi as Abi },
  'Node Management': { name: 'Node Management', abi: nodeManagementAbi as Abi },
  'B3TR MultiSig': { name: 'B3TR MultiSig', abi: multiSigWalletAbi as Abi },
}

const CURATED_ADDRESS_TO_NAME: Record<NetworkName, Record<AddressString, string>> = {
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
    '0xb0ef9d89c6b49cba6bbf86bf2fdf0eee4968c6ab': 'Node Management',
    '0x4dd13fcb7b4f7dc19048ce0d23aaebbdb3f3a1d9': 'B3TR MultiSig',
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
    '0x592c756df7a5d39de1735030e8b9c18b7417e6c4': 'VeBetter Passport',
    '0x328710f4925c3e4c04961882b96c50cc7cd9d958': 'DBA Pool',
    '0x92b5a7484970d9b2ad981e8135ff14e6f996dc04': 'Relayers Rewards Pool',
    '0xb89f0ecdaf9987f87912d6c77756435fe4085b05': 'X2Earn Creator NFT',
    '0x005af71e9b2d629c0c6e2f9d39fdfd1bb967c0ea': 'Grants Manager',
    '0x15a38b65f26bdbca50addf3865732613a45bbc00': 'Navigator Registry',
    '0x9529916b152357e7e2990c3ce4fe5373d7da54bc': 'B3TR Challenges',
    '0xde17d0a516c38c168d37685bb71465f656aa256e': 'Node Management',
    '0x887d9102f0003f1724d8fd5d4fe95a11572fcd77': 'StarGate NFT',
    '0x1e02b2953adefec225cf0ec49805b1146a4429c1': 'StarGate Delegation',
    '0x713b908bcf77f3e00efef328e50b657a1a23aeaf': 'Smart Account Factory',
    '0x8dbce5de4c1f1840a47ab10c682aee48e9d06c20': 'Legacy VeChain Nodes',
    '0xdccaabd81b38e0deef4c202bc7f1261a4d9192c6': 'Oracle (vechain.energy)',
  },
  [NetworkName.SOLO]: {},
}

const normalize = (address: string): AddressString => address.toLowerCase() as AddressString

const VECHAINSTATS_NAMES: Record<AddressString, string> = vechainstatsNamesRaw as Record<AddressString, string>

function getKnownContract(networkName: NetworkName, address: AddressString | null | undefined): KnownContract | null {
  if (!address) return null
  const key = normalize(address)
  const builtin = BUILTIN[key]
  if (builtin) return builtin
  const curatedName = CURATED_ADDRESS_TO_NAME[networkName]?.[key]
  if (curatedName) {
    const entry = CURATED_ABIS_BY_NAME[curatedName]
    if (entry) return entry
    // Curated address with no bundled ABI — caller (resolver) will try Sourcify.
    return { name: curatedName, abi: [] }
  }
  // vechainstats community-curated names — mainnet-only, name without ABI.
  // The resolver will fall through to Sourcify for the ABI itself.
  if (networkName === NetworkName.MAINNET) {
    const vcsName = VECHAINSTATS_NAMES[key]
    if (vcsName) return { name: vcsName, abi: [] }
  }
  return null
}

export function getKnownContractName(
  networkName: NetworkName,
  address: AddressString | null | undefined,
): string | null {
  return getKnownContract(networkName, address)?.name ?? null
}

export function getKnownContractAbi(networkName: NetworkName, address: AddressString | null | undefined): Abi | null {
  const entry = getKnownContract(networkName, address)
  if (!entry || entry.abi.length === 0) return null
  return entry.abi
}

export function isBuiltinAddress(address: AddressString | null | undefined): boolean {
  if (!address) return false
  return normalize(address) in BUILTIN
}

// Returns every bundled ABI (built-ins + curated). Useful for error / event
// selector lookup when we don't know which contract emitted the data —
// reverts in particular often come from a contract called internally, not
// the clause's target.
export function getAllBundledAbis(): Abi[] {
  const out: Abi[] = []
  for (const v of Object.values(BUILTIN)) out.push(v.abi)
  for (const v of Object.values(CURATED_ABIS_BY_NAME)) out.push(v.abi)
  return out
}
