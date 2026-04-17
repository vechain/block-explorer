import type { AddressString } from '@/lib/schemas'
import { type Network, NetworkName, NETWORKS } from './network'

// Stargate app URLs
export const STARGATE_APP_URL = 'https://app.stargate.vechain.org'
export const STARGATE_TESTNET_APP_URL = 'https://testnet.app.stargate.vechain.org'

// Get the Stargate base URL for the given network
export const getStargateBaseUrl = (networkName: NetworkName): string =>
  networkName === NetworkName.MAINNET ? STARGATE_APP_URL : STARGATE_TESTNET_APP_URL

// Build a Stargate link with an optional path
export const getStargateLink = (networkName: NetworkName, path = ''): string =>
  `${getStargateBaseUrl(networkName)}${path}`

export const getStargateNftAddress = (network: Network): AddressString | undefined => {
  if (network.name === NetworkName.SOLO) return network.contracts.stargateNft
  return NETWORKS[network.name].contracts.stargateNft
}

export const isStargateNftContract = (contractAddress: AddressString, network: Network): boolean => {
  const stargateNftAddress = getStargateNftAddress(network)
  if (!stargateNftAddress) return false
  return contractAddress.toLowerCase() === stargateNftAddress.toLowerCase()
}

export const STARGATE_NFTS = [
  {
    id: '1',
    name: 'Strength',
    isX: false,
    maturityBlocks: '259200',
    scaledRewardFactor: '150',
    vetAmountRequiredToStake: '1000000000000000000000000',
    image: 'https://api.gateway-proxy.vechain.org/ipfs/bafybeieklmew7smiodfyivraogxk7z2dibrtd2j5kxe563qzmjx4344uo4',
    lockedImage: '/nft-images/thunder-x.png',
  },
  {
    id: '2',
    name: 'Thunder',
    isX: false,
    maturityBlocks: '388800',
    scaledRewardFactor: '250',
    vetAmountRequiredToStake: '5000000000000000000000000',
    image: 'https://api.gateway-proxy.vechain.org/ipfs/bafkreif4maxohbjmsyc3ozhmz6kmcamtjoprtcd23ebxzmwmz4kmsr6fny',
    lockedImage: '/nft-images/thunder-x.png',
  },
  {
    id: '3',
    name: 'Mjolnir',
    isX: false,
    maturityBlocks: '518400',
    scaledRewardFactor: '350',
    vetAmountRequiredToStake: '15000000000000000000000000',
    image: 'https://api.gateway-proxy.vechain.org/ipfs/bafybeibxpkwoqcze6pltmwgacfqjnxodxrvppfjmbwa4mrcdhrm4stprnm',
    lockedImage: '/nft-images/thunder-x.png',
  },
  {
    id: '4',
    name: 'VeThorX',
    isX: true,
    maturityBlocks: '0',
    scaledRewardFactor: '200',
    vetAmountRequiredToStake: '600000000000000000000000',
    image: 'https://api.gateway-proxy.vechain.org/ipfs/bafkreifk3pxil5synjhbvfylmer5njyrtim5eoueyeh5h5c5mfazorvguu',
    lockedImage: '/nft-images/thunder-x.png',
  },
  {
    id: '5',
    name: 'StrengthX',
    isX: true,
    maturityBlocks: '0',
    scaledRewardFactor: '300',
    vetAmountRequiredToStake: '1600000000000000000000000',
    image: 'https://api.gateway-proxy.vechain.org/ipfs/bafybeibhf2irogy7xvbw5c2cgsguytn2zdhpmbz64rruucudby4xe3bei4',
    lockedImage: '/nft-images/thunder-x.png',
  },
  {
    id: '6',
    name: 'ThunderX',
    isX: true,
    maturityBlocks: '0',
    scaledRewardFactor: '400',
    vetAmountRequiredToStake: '5600000000000000000000000',
    image: 'https://api.gateway-proxy.vechain.org/ipfs/bafkreidctlxqyqbsgz3k6rqch3gxjqkrfxhfn4j2uqo4h2mcrvofby5v5y',
    lockedImage: '/nft-images/thunder-x.png',
  },
  {
    id: '7',
    name: 'MjolnirX',
    isX: true,
    maturityBlocks: '0',
    scaledRewardFactor: '500',
    vetAmountRequiredToStake: '15600000000000000000000000',
    image: 'https://api.gateway-proxy.vechain.org/ipfs/bafkreicanslc5x6h3tbpomgiop6fzdfqb7fg4ecqlqwi26nd3m4wekhmxm',
    lockedImage: '/nft-images/thunder-x.png',
  },
  {
    id: '8',
    name: 'Dawn',
    isX: false,
    maturityBlocks: '17280',
    scaledRewardFactor: '100',
    vetAmountRequiredToStake: '10000000000000000000000',
    image: 'https://api.gateway-proxy.vechain.org/ipfs/bafybeiboqglapq7jk6wlbewtxomokmburqwpaljurkrtxi2r5x3iud56sy',
    lockedImage: '/nft-images/thunder-x.png',
  },
  {
    id: '9',
    name: 'Lightning',
    isX: false,
    maturityBlocks: '43200',
    scaledRewardFactor: '115',
    vetAmountRequiredToStake: '50000000000000000000000',
    image: 'https://api.gateway-proxy.vechain.org/ipfs/bafybeicri7fskgm5cceeiwabvhdmjy3hmdgjpafcmnc6rcr666sqcctzsy',
    lockedImage: '/nft-images/thunder-x.png',
  },
  {
    id: '10',
    name: 'Flash',
    isX: false,
    maturityBlocks: '129600',
    scaledRewardFactor: '130',
    vetAmountRequiredToStake: '200000000000000000000000',
    image: 'https://api.gateway-proxy.vechain.org/ipfs/bafkreibp3b74kjak5rkvm3k2rnaonvnkshgetgz2eluthpylqnv7lf3erm',
    lockedImage: '/nft-images/thunder-x.png',
  },
]
