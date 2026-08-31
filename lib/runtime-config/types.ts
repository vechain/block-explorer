import z from 'zod'
import { addressStringSchema } from '@/lib/schemas'

// Defaulted, not required: mid-rollout containers serve payloads without them.
export const runtimeConfigSchema = z.object({
  appVersion: z.string(),
  allowDevMode: z.boolean(),
  bypassIndexerProxy: z.boolean(),
  b32Url: z.url().default('https://b32.vecha.in'),
  openchainUrl: z.url().default('https://api.openchain.xyz/signature-database/v1/lookup'),
  soloContracts: z.object({
    b3tr: addressStringSchema.optional(),
    vot3: addressStringSchema.optional(),
    stargateNft: addressStringSchema.optional(),
    stargateDelegation: addressStringSchema.optional(),
  }),
})

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = runtimeConfigSchema.parse({
  appVersion: 'dev',
  allowDevMode: false,
  bypassIndexerProxy: false,
  soloContracts: {},
})

export const RUNTIME_CONFIG_URL = '/runtime-config.json'
export const RUNTIME_CONFIG_WINDOW_KEY = '__BLOCK_EXPLORER_RUNTIME_CONFIG__'
