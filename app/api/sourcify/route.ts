import { type NextRequest, NextResponse } from 'next/server'
import type { Abi } from 'viem'
import { SOURCIFY_URL } from '@/env.api'
import { createErrorResponse } from '@/lib/api/index'

interface SourcifyFile {
  name: string
  path?: string
  content?: string
}

interface SourcifyResponse {
  status?: string
  files?: SourcifyFile[]
}

interface ContractMetadata {
  output?: {
    abi?: unknown
  }
  settings?: {
    compilationTarget?: Record<string, string>
  }
}

export interface SourcifyAbiResponse {
  abi: Abi
  contractName?: string
}

const extractAbi = (files: SourcifyFile[]): SourcifyAbiResponse | null => {
  const metadataFile = files.find(f => f.name === 'metadata.json' || (f.path && f.path.endsWith('/metadata.json')))
  if (!metadataFile?.content) return null
  try {
    const meta = JSON.parse(metadataFile.content) as ContractMetadata
    if (!meta?.output?.abi || !Array.isArray(meta.output.abi)) return null
    const target = meta.settings?.compilationTarget
    const contractName = target ? Object.values(target)[0] : undefined
    return { abi: meta.output.abi as Abi, contractName }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const chainId = searchParams.get('chainId')
  const address = searchParams.get('address')

  if (!chainId || !/^\d+$/.test(chainId)) {
    return createErrorResponse({ status: 400, message: 'chainId query parameter must be a numeric string' })
  }
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return createErrorResponse({ status: 400, message: 'address query parameter must be a hex address' })
  }

  try {
    const response = await fetch(`${SOURCIFY_URL}/files/any/${chainId}/${address.toLowerCase()}`, {
      signal: AbortSignal.timeout(10_000),
    })

    if (response.status === 404) {
      return createErrorResponse({ status: 404, message: 'Contract not verified on Sourcify' })
    }
    if (!response.ok) {
      return createErrorResponse({ status: 502, message: `Sourcify responded ${response.status}` })
    }

    const data = (await response.json()) as SourcifyResponse
    if (!data?.files) {
      return createErrorResponse({ status: 502, message: 'Sourcify response missing files array' })
    }

    const extracted = extractAbi(data.files)
    if (!extracted) {
      return createErrorResponse({ status: 404, message: 'No ABI found in Sourcify metadata' })
    }

    return NextResponse.json(extracted)
  } catch (error) {
    console.error('Unexpected error in sourcify route:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      chainId,
      address,
    })
    return createErrorResponse({ status: 500, message: 'An unexpected error occurred' })
  }
}
