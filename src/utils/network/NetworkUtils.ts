import { VALID_NETWORKS } from "@/constants/network/NetworkConst.ts"

export const getNetworkByUrl = (url: string) => VALID_NETWORKS.find(network => network.url === url.trim().toLowerCase())
