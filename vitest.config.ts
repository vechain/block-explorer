import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  // vite 8 resolves tsconfig `paths` natively, so vite-tsconfig-paths is gone.
  resolve: { tsconfigPaths: true },
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
