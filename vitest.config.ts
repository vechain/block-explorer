import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    env: {
      NEXT_PUBLIC_COIN_API_URL: 'https://coin-api.test',
      NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL: 'https://indexer.mainnet.test',
      NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL: 'https://indexer.testnet.test',
      NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL: 'https://ipfs.test',
    },
  },
})
