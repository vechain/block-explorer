import { useQuery } from "@tanstack/react-query"
import { getTokenUsdPrice } from "./actions"

export function useTokenUsdPrice(tokens: string[]) {
  return useQuery({
    queryKey: [getTokenUsdPrice.name, tokens],
    queryFn: () => getTokenUsdPrice(tokens),
  })
}
