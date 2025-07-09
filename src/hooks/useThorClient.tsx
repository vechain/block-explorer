import { ThorClientContext } from "@/context/ThorClientContext"
import { useContext } from "react"

export function useThorClient() {
  const context = useContext(ThorClientContext)
  if (!context) {
    throw new Error("useThorClient must be used within a ThorClientProvider")
  }
  return context
}
