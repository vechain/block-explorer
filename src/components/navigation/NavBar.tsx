// src/components/Navbar.tsx
import { HStack } from "@chakra-ui/react"
import NetworkSwitcher from "@/components/network/NetworkSwitcher.tsx"
import { ColorModeButton } from "@/components/ui/ColorMode.tsx"
import SearchBar from "@/components/search/SearchBar.tsx"

const Navbar = () => {
  return (
    <HStack padding={4}>
      <a href="/">Home</a>
      <NetworkSwitcher />
      <ColorModeButton />
      <SearchBar />
    </HStack>
  )
}

export default Navbar
