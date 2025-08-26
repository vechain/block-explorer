import { useQuery } from "@tanstack/react-query"
import { getAbi } from "./actions"

export const useAbi = (signature: string) => {
  return useQuery({
    queryKey: [getAbi.name, signature],
    queryFn: () => getAbi({ signature }),
    retry: false,
  })
}
