import { createSystem, defaultConfig } from "@chakra-ui/react"

export const config = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'Roboto', sans-serif` },
        body: { value: `'Roboto', sans-serif` },
      },
      colors: {
        white: {
          value: "#fff",
        },
        grey: {
          200: { value: "#E7E9EB" },
          300: { value: "#D2D5D9" },
          400: { value: "#AAAFB6" },
          500: { value: "#747C89" },
          600: { value: "#525860" },
          700: { value: "#363A3F" },
        },
      },
    },
  },
})
