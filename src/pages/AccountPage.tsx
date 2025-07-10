import { useNavigate, useParams } from "react-router-dom"
import { AccountDetails } from "@/components/accounts/AccountDetails.tsx"
import { parseAddress } from "@/utils/address"

export default function AccountPage() {
  const { address } = useParams<{ address: string }>()
  const navigate = useNavigate()

  const addr = parseAddress(address)

  if (!addr) {
    navigate("/404")
    return null
  }

  return <AccountDetails address={addr} />
}
