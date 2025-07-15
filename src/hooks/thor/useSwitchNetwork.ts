import { useThorClient } from "./useThorClient"

export function useSwitchNetwork() {
  const { activeNetwork, switchNetwork } = useThorClient()
  return { activeNetwork, switchNetwork }
}
