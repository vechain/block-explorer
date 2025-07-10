import { useNavigate, useParams } from "react-router-dom"
import { BlockDetails } from "@/components/blocks/BlockDetails.tsx"
import { parseRevision } from "@/utils/revision"

export function BlockDetailsPage() {
  const { blockId } = useParams<{ blockId: string }>()
  const navigate = useNavigate()

  const revision = parseRevision(blockId)

  if (!revision) {
    navigate("/404")
    return null
  }

  return <BlockDetails revision={revision} />
}
