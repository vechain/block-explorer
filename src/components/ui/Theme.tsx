import { createSystem, defaultConfig } from "@chakra-ui/react"

export const config = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'Roboto', sans-serif` },
        body: { value: `'Roboto', sans-serif` },
      },
    },
  },
})


