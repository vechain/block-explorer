# Build stage
FROM node:20.19.0-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN corepack enable && \
    corepack prepare pnpm@9.15.4 --activate && \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments for all configurable URLs
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL=https://api.gateway-proxy.vechain.org
ARG B32_URL=https://b32.vecha.in
ARG NEXT_PUBLIC_COIN_API_URL=https://coin-api.veworld.vechain.org
ARG NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL=https://indexer.mainnet.vechain.org
ARG NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL=https://indexer.testnet.vechain.org

# Set environment variables for build
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
ENV NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL=${NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL}
ENV B32_URL=${B32_URL}
ENV NEXT_PUBLIC_COIN_API_URL=${NEXT_PUBLIC_COIN_API_URL}
ENV NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL=${NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL}
ENV NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL=${NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL}

# Build the application
RUN pnpm build

# Production stage
FROM node:20.19.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user for security
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

# Copy built application with correct ownership
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
