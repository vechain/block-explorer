import { describe, it, expect } from "vitest"
import { getNetworkByUrl } from "./NetworkUtils"
import { VALID_NETWORKS } from "@/constants/network/NetworkConst"

describe("getNetworkByUrl", () => {
  it("should return the correct network object when a valid URL is provided", () => {
    const url = VALID_NETWORKS[0].url
    const result = getNetworkByUrl(url)
    expect(result).toEqual(VALID_NETWORKS[0])
  })

  it("should return undefined when an invalid URL is provided", () => {
    const url = "https://invalid.url"
    const result = getNetworkByUrl(url)
    expect(result).toBeUndefined()
  })

  it("should be case insensitive", () => {
    const url = VALID_NETWORKS[0].url.toUpperCase()
    const result = getNetworkByUrl(url)
    expect(result).toEqual(VALID_NETWORKS[0])
  })

  it("should ignore trailing whitespace", () => {
    const url = VALID_NETWORKS[0].url + " "
    const result = getNetworkByUrl(url)
    expect(result).toEqual(VALID_NETWORKS[0])
  })

  it("should ignore leading whitespace", () => {
    const url = " " + VALID_NETWORKS[0].url
    const result = getNetworkByUrl(url)
    expect(result).toEqual(VALID_NETWORKS[0])
  })
})
