import { useQuery } from "@tanstack/react-query"
import { getPriceList } from "./actions"

export function usePriceList() {
  return useQuery({
    queryKey: [getPriceList.name],
    queryFn: getPriceList,
  })
}
