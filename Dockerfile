# Build stage
FROM node:20.17.0-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN corepack enable && \
    corepack prepare pnpm@9.15.4 --activate && \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments
ARG NEXT_PUBLIC_APP_VERSION

# Set environment variables for build
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
ENV NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL=https://api.gateway-proxy.vechain.org
ENV B32_URL=https://b32.vecha.in
ENV NEXT_PUBLIC_COIN_API_URL=https://coin-api.veworld.vechain.org
ENV NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL=https://indexer.mainnet.vechain.org/api/v1
ENV NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL=https://indexer.testnet.vechain.org/api/v1
ENV NEXT_PUBLIC_VEWORLD_INDEXER_V2_MAINNET_URL=https://indexer.mainnet.vechain.org/api/v2
ENV NEXT_PUBLIC_VEWORLD_INDEXER_V2_TESTNET_URL=https://indexer.testnet.vechain.org/api/v2

ENV NEXT_PUBLIC_VEWORLD_INDEXER_SOLO_URL=https://localhost:5000

# Build the application
RUN pnpm build

# Production stage
FROM node:20.17.0-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
