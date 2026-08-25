// Defaults match the Dockerfile ARG/ENV pair so a runtime that doesn't
// preserve the image ENV (e.g. App Runner's runtime_environment_variables
// substitution) still resolves to the canonical upstream. Importing this
// module used to throw when B32_URL was absent, which silently took down
// every route that pulled it in (including the selector decoder and
// Sourcify) with a 500.
export const B32_URL = process.env.B32_URL ?? 'https://b32.vecha.in'

export const SOURCIFY_URL = process.env.SOURCIFY_URL ?? 'https://sourcify.dev/server'

export const OPENCHAIN_URL = process.env.OPENCHAIN_URL ?? 'https://api.openchain.xyz/signature-database/v1/lookup'

// Lifts the indexer's per-IP rate limit, which the proxy would otherwise hit as a whole:
// every user's cached indexer call leaves from one App Runner IP. Blank outside prod,
// where direct traffic stays under the limit — see terraform/frontend/secrets.tf.
export const INDEXER_RATE_LIMIT_BYPASS = process.env.INDEXER_RATE_LIMIT_BYPASS?.trim()
