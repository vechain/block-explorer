import { useQuery } from "@tanstack/react-query"
import { getVetVthoUsdPrice } from "./actions"

export function useVetVthoUsdPrice() {
  return useQuery({
    queryKey: [getVetVthoUsdPrice.name],
    queryFn: getVetVthoUsdPrice,
  })
}
