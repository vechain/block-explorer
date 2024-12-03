import { Address } from "@vechain/sdk-core"
import { useVnsQuery } from "@/hooks/vns/useVnsQuery.ts"
import { useEffect, useState } from "react"

export const useVns = (address: Address) => {
  const { getVnsName } = useVnsQuery()
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    getVnsName(address).then(setName)
  }, [address, getVnsName])

  return { name }
}
