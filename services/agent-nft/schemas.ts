import z from 'zod'
import { addressStringSchema, type AddressString } from '@/lib/schemas'

/**
 * `type` marker written into the on-chain `tokenURI` JSON by the VeChain agent
 * marketplace. Its presence is how the explorer recognises that an NFT is an
 * agent NFT (an ERC-8004 registration file) rather than a plain collectible.
 * Source: agent-marketplace `apps/backend/src/agents/registration-file.ts`.
 */
export const AGENT_REGISTRATION_TYPE = 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1'

/** One advertised endpoint in the registration file's `services` array. */
const registrationServiceSchema = z.object({
  name: z.string().default(''),
  endpoint: z.string().default(''),
  version: z.string().optional(),
})

/**
 * The ERC-8004 registration file served at an agent NFT's `tokenURI`. Only the
 * `type` marker is required — every other field is defaulted so a slightly
 * different registration file still parses. A plain-NFT metadata blob lacks the
 * `type` marker and fails the parse (see {@link isAgentRegistration}).
 */
export const agentRegistrationSchema = z.object({
  type: z.literal(AGENT_REGISTRATION_TYPE),
  name: z.string().default(''),
  description: z.string().nullable().default(null),
  image: z.string().nullable().default(null),
  services: z.array(registrationServiceSchema).default([]),
  x402Support: z.boolean().default(false),
  active: z.boolean().default(true),
  registrations: z
    .array(
      z.object({
        agentId: z.number(),
        // CAIP-10 style reference, e.g. `eip155:100010:0x271eb84c...`.
        agentRegistry: z.string(),
      }),
    )
    .default([]),
  supportedTrust: z.array(z.string()).default([]),
  reputationRegistry: z
    .object({
      chainId: z.number(),
      address: addressStringSchema,
    })
    .nullable()
    .default(null),
})

/**
 * The A2A AgentCard — a separate document fetched from the registration file's
 * `A2A` service endpoint (`.../agent-card.json`). Skills live here, NOT in the
 * registration file's `services`.
 */
export const agentCardSchema = z.object({
  name: z.string().default(''),
  description: z.string().nullable().default(null),
  url: z.string().default(''),
  version: z.string().default(''),
  capabilities: z.object({ streaming: z.boolean().default(false) }).default({ streaming: false }),
  defaultInputModes: z.array(z.string()).default([]),
  defaultOutputModes: z.array(z.string()).default([]),
  skills: z
    .array(
      z.object({
        id: z.string().default(''),
        name: z.string().default(''),
        description: z.string().nullable().default(null),
      }),
    )
    .default([]),
})

export type AgentRegistration = z.infer<typeof agentRegistrationSchema>
export type AgentCard = z.infer<typeof agentCardSchema>

/** True when `data` is a parseable agent-marketplace ERC-8004 registration file. */
export const isAgentRegistration = (data: unknown): data is AgentRegistration =>
  agentRegistrationSchema.safeParse(data).success

/** The endpoint of the `A2A` service entry, if the agent advertises one. */
export const getAgentCardEndpoint = (registration: AgentRegistration): string | undefined =>
  registration.services.find(service => service.name.toUpperCase() === 'A2A')?.endpoint || undefined

/**
 * Pull the plain address out of a CAIP-10 `eip155:<chainId>:<address>` reference.
 * Returns null when the reference does not contain a valid address.
 */
export const parseCaipAddress = (reference: string | undefined): AddressString | null => {
  if (!reference) return null
  const candidate = reference.includes(':') ? reference.split(':').pop() : reference
  const result = addressStringSchema.safeParse(candidate)
  return result.success ? result.data : null
}
