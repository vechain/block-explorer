const BASE_URL = "https://b32.vecha.in"

export async function get({ endPoint }: { endPoint: string }) {
  const url = BASE_URL + endPoint

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
