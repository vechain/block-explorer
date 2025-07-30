// This is a proxy to avoid CORS issues. Proxy is configured in vite.config.ts
const PROXY_URL = "/api/b32"
// const BASE_URL = "https://b32.vecha.in"

export async function get({ endPoint }: { endPoint: string }) {
  const url = PROXY_URL + endPoint

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  if (res.status === 404) {
    throw new Error("No ABI found")
  }

  if (!res.ok) {
    throw new Error(`Failed to query ABI - status: ${res.status}`)
  }

  return await res.json()
}
