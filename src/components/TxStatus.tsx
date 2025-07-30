import { Badge } from "@chakra-ui/react"

type TxStatus = "success" | "reverted" | "pending"

export const TxStatus = ({ status }: { status: TxStatus }) => {
  let statusText
  let colorPalette

  switch (status) {
    case "success":
      statusText = "success"
      colorPalette = "green"
      break
    case "reverted":
      statusText = "Reverted"
      colorPalette = "red"
      break
    case "pending":
      statusText = "Pending"
      colorPalette = "yellow"
      break
    default:
      statusText = "Unknown"
      colorPalette = "gray"
      break
  }

  return (
    <Badge variant="surface" size="sm" colorPalette={colorPalette}>
      {statusText}
    </Badge>
  )
}
