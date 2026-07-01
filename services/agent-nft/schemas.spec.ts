import { describe, expect, it } from 'vitest'
import {
  AGENT_REGISTRATION_TYPE,
  agentCardSchema,
  agentRegistrationSchema,
  getAgentCardEndpoint,
  isAgentRegistration,
  parseCaipAddress,
} from './schemas'

// Real ERC-8004 registration file shape served at an agent NFT's tokenURI.
const registrationFixture = {
  type: AGENT_REGISTRATION_TYPE,
  name: 'Atelier Agent',
  description: 'Shape your agent’s identity, role, and voice.',
  image: 'http://localhost:3001/api/agents/2e991bd5/avatar?v=7570dcf1.jpg',
  services: [
    { name: 'web', endpoint: 'http://localhost:3000/agents/2e991bd5' },
    { name: 'A2A', endpoint: 'http://localhost:3001/api/agents/onchain/2/agent-card.json', version: '0.3.0' },
  ],
  x402Support: false,
  active: true,
  registrations: [{ agentId: 2, agentRegistry: 'eip155:100010:0x271eb84c5095db823d76f87e10bb19016b117073' }],
  supportedTrust: ['reputation'],
  reputationRegistry: { chainId: 100010, address: '0x654ea4792c34b518970f1b28dbce1d10f0562ae7' },
}

const agentCardFixture = {
  name: 'Atelier Agent',
  description: 'Shape your agent’s identity, role, and voice.',
  url: 'http://localhost:3000/agents/2e991bd5',
  version: '1',
  capabilities: { streaming: true },
  defaultInputModes: ['text/plain'],
  defaultOutputModes: ['text/plain'],
  skills: [{ id: 'c42b72a8', name: 'skill-1', description: 'Summarize emails' }],
}

// A plain ERC-721 metadata blob (no agent markers).
const plainNftMetadata = {
  name: 'Cool Cat #1',
  description: 'A cool cat',
  image: 'ipfs://Qm.../1.png',
  attributes: [{ trait_type: 'Background', value: 'Blue' }],
}

describe('isAgentRegistration', () => {
  it('recognises an agent registration file by its `type` marker', () => {
    expect(isAgentRegistration(registrationFixture)).toBe(true)
  })

  it('rejects a plain NFT metadata blob', () => {
    expect(isAgentRegistration(plainNftMetadata)).toBe(false)
  })

  it('rejects a registration file with the wrong `type` marker', () => {
    expect(isAgentRegistration({ ...registrationFixture, type: 'something/else' })).toBe(false)
  })

  it('rejects null / non-objects', () => {
    expect(isAgentRegistration(null)).toBe(false)
    expect(isAgentRegistration('nope')).toBe(false)
  })
})

describe('agentRegistrationSchema', () => {
  it('parses the fixture and exposes agent fields', () => {
    const parsed = agentRegistrationSchema.parse(registrationFixture)
    expect(parsed.name).toBe('Atelier Agent')
    expect(parsed.registrations[0]?.agentId).toBe(2)
    expect(parsed.reputationRegistry?.address).toBe('0x654ea4792c34b518970f1b28dbce1d10f0562ae7')
    expect(parsed.reputationRegistry?.chainId).toBe(100010)
    expect(parsed.services).toHaveLength(2)
    expect(parsed.active).toBe(true)
  })

  it('defaults optional fields on a minimal registration file', () => {
    const parsed = agentRegistrationSchema.parse({ type: AGENT_REGISTRATION_TYPE })
    expect(parsed.services).toEqual([])
    expect(parsed.supportedTrust).toEqual([])
    expect(parsed.reputationRegistry).toBeNull()
    expect(parsed.x402Support).toBe(false)
    expect(parsed.active).toBe(true)
  })
})

describe('getAgentCardEndpoint', () => {
  it('returns the A2A service endpoint', () => {
    const parsed = agentRegistrationSchema.parse(registrationFixture)
    expect(getAgentCardEndpoint(parsed)).toBe('http://localhost:3001/api/agents/onchain/2/agent-card.json')
  })

  it('returns undefined when there is no A2A service', () => {
    const parsed = agentRegistrationSchema.parse({
      type: AGENT_REGISTRATION_TYPE,
      services: [{ name: 'web', endpoint: 'https://example.com' }],
    })
    expect(getAgentCardEndpoint(parsed)).toBeUndefined()
  })
})

describe('parseCaipAddress', () => {
  it('extracts the address from a CAIP-10 reference', () => {
    expect(parseCaipAddress('eip155:100010:0x271eb84c5095db823d76f87e10bb19016b117073')).toBe(
      '0x271eb84c5095db823d76f87e10bb19016b117073',
    )
  })

  it('accepts a bare address and rejects junk', () => {
    expect(parseCaipAddress('0x271eb84c5095db823d76f87e10bb19016b117073')).toBe(
      '0x271eb84c5095db823d76f87e10bb19016b117073',
    )
    expect(parseCaipAddress('eip155:100010:not-an-address')).toBeNull()
    expect(parseCaipAddress(undefined)).toBeNull()
  })
})

describe('agentCardSchema', () => {
  it('parses the A2A card fixture', () => {
    const parsed = agentCardSchema.parse(agentCardFixture)
    expect(parsed.capabilities.streaming).toBe(true)
    expect(parsed.skills[0]?.name).toBe('skill-1')
    expect(parsed.defaultInputModes).toEqual(['text/plain'])
  })
})
