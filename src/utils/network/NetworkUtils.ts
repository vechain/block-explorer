import { VALID_NETWORKS } from "@/constants/network/NetworkConst.ts"

export const isValidNetwork = (url: string) => VALID_NETWORKS.some(network => network.url === url)

export const getNetworkByUrl = (url: string) => VALID_NETWORKS.find(network => network.url === url)
