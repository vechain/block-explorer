import { VStack } from "@chakra-ui/react"
import { useLatestBlocks } from "@/hooks/blocks/useLatestBlocks.ts"
import { Block } from "@/components/blocks/Block.tsx"

export const LatestBlocks = ({ count }: { count: number }) => {
  const blocks = useLatestBlocks({ count })

  return (
    <VStack>
      {blocks.blocks.map((b, i) => (
        <Block block={b} key={`block-${i}`} />
      ))}
    </VStack>
  )
}
