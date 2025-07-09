import { useThorClient } from "@/hooks/useThorClient"

export function useSwitchNetwork() {
  const { activeNetwork, switchNetwork } = useThorClient()
  return { activeNetwork, switchNetwork }
}
