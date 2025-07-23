import { NetworkName } from "@/constants/network"

const MAINNET_URL = "https://indexer.mainnet.vechain.org/api/v1"
const TESTNET_URL = "https://indexer.testnet.vechain.org/api/v1"

export async function get({
  endPoint,
  network = NetworkName.MAINNET,
  params,
}: {
  endPoint: string
  network: NetworkName
  params?: Record<string, string>
}) {
  const url = getUrl(network) + endPoint + "?" + new URLSearchParams(params).toString()

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`)
  }

  return await res.json()
}

function getUrl(network: NetworkName) {
  if (network === NetworkName.MAINNET) return MAINNET_URL
  if (network === NetworkName.TESTNET) return TESTNET_URL
  if (network === NetworkName.SOLO) {
    throw new Error("No indexer for solo network")
  }

  throw new Error("Invalid network")
}
