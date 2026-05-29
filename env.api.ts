if (!process.env.B32_URL) {
  throw new Error('B32_URL is not set')
}

export const B32_URL = process.env.B32_URL

export const SOURCIFY_URL = process.env.SOURCIFY_URL ?? 'https://sourcify.dev/server'

export const OPENCHAIN_URL = process.env.OPENCHAIN_URL ?? 'https://api.openchain.xyz/signature-database/v1/lookup'
