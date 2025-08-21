import { useQuery } from "@tanstack/react-query"
import { getPriceList } from "./actions"

export const usePriceList = () => {
  return useQuery({
    queryKey: [getPriceList.name],
    queryFn: getPriceList,
  })
}
