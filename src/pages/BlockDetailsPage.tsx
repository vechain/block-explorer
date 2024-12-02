// src/pages/BlockDetailsPage.tsx
import { useParams } from "react-router-dom"
import { useBlockQuery } from "@/hooks/blocks/useBlockQuery.ts"
import { useEffect, useState } from "react"
import { ExpandedBlockDetail } from "@vechain/sdk-network"
import { BlockDetails } from "@/components/blocks/BlockDetails.tsx"

const BlockDetailsPage = () => {
  const { blockId } = useParams<{ blockId: string }>()
  const { getBlock } = useBlockQuery()
  const [block, setBlock] = useState<ExpandedBlockDetail | null>(null)

  useEffect(() => {
    if (!blockId) return
    getBlock(blockId).then(b => setBlock(b))
  }, [blockId, getBlock])

  if (!block) return <div>Loading...</div>

  return <BlockDetails block={block} />
}

export default BlockDetailsPage
