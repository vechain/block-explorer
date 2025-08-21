const BASE_URL = "https://coin-api.veworld.vechain.org"

export const get = async ({ endPoint, params }: { endPoint: string; params?: Record<string, string> }) => {
  const url = BASE_URL + endPoint + "?" + new URLSearchParams(params).toString()

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`)
  }

  return await res.json()
}
