if (!process.env.B32_URL) {
  throw new Error('B32_URL is not set')
}

export const B32_URL = process.env.B32_URL
