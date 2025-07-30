// This is a proxy to avoid CORS issues. Proxy is configured in vite.config.ts
const PROXY_URL = "/api/coingecko"
// const BASE_URL = "https://api.coingecko.com/api/v3"

export async function get({ endPoint, params }: { endPoint: string; params?: Record<string, string> }) {
  const url = PROXY_URL + endPoint + "?" + new URLSearchParams(params).toString()

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`)
  }

  return await res.json()
}
