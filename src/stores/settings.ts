import { ColorMode } from "@/components/ui/theme/color-mode"
import { Network, NetworkName, NETWORKS } from "@/constants/network"
import { create } from "zustand"
import { persist } from "zustand/middleware"

enum Locale {
  EN = "en",
  FR = "fr",
}

enum Currency {
  USD = "usd",
  EUR = "eur",
  CNY = "cny",
}

type SettingsStore = {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  currency: Currency
  setCurrency: (currency: Currency) => void
  locale: Locale
  setLocale: (locale: Locale) => void
  activeNetwork: Network
  setActiveNetwork: (network: Network) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    set => ({
      locale: Locale.EN,
      setLocale: locale => set({ locale }),
      colorMode: ColorMode.LIGHT,
      setColorMode: colorMode => set({ colorMode }),
      currency: Currency.USD,
      setCurrency: currency => set({ currency }),
      activeNetwork: NETWORKS[NetworkName.MAINNET],
      setActiveNetwork: network => set({ activeNetwork: network }),
    }),
    { name: "settings" },
  ),
)
