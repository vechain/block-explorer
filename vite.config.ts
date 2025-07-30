import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import path from "path"

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/api/coingecko": {
        target: "https://api.coingecko.com/api/v3",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/coingecko/, ""),
      },
    },
  },
})
