// src/components/Navbar.tsx
import { HStack } from "@chakra-ui/react"
import NetworkSwitcher from "@/components/network/NetworkSwitcher.tsx"
import { ColorModeButton } from "@/components/ui/ColorMode.tsx"

const Navbar = () => {
  return (
    <HStack padding={4}>
      <a href="/">Home</a>
      <NetworkSwitcher />
      <ColorModeButton />
    </HStack>
  )
}

export default Navbar
