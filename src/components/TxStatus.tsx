import { Badge } from "@chakra-ui/react"

export const TxStatus = ({ reverted }: { reverted: boolean }) => {
  return reverted ? <Badge colorPalette="red">Reverted</Badge> : <Badge colorPalette="green">Success</Badge>
}
