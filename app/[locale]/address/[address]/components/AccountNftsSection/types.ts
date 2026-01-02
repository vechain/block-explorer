import type { Erc721 } from '@/services/thor/tokens/erc721'

export type Erc721WithTokenIds = Erc721 & { tokenIds: bigint[] }
