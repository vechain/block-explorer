import { Navigate, useParams } from "react-router-dom"
import { parseAddress } from "@/utils/address"

import { useAccount } from "@/hooks/thor/useAccount"
import { Address } from "@vechain/sdk-core"
import { ContractDetails } from "./components/ContractDetails"
import { AccountDetails } from "./components/AccountDetails"

export const AddressPage = () => {
  const { address } = useParams<{ address: string }>()

  const addr = parseAddress(address)

  if (!addr) {
    return <Navigate to="/404" replace state={{ message: "Invalid address" }} />
  }

  return <RenderAccountOrContract address={addr} />
}

const RenderAccountOrContract = ({ address }: { address: Address }) => {
  const { data: account, isLoading: isAccountLoading } = useAccount(address)

  if (isAccountLoading) return <div>Loading...</div>

  if (!account) {
    return <Navigate to="/404" replace state={{ message: "The account you are looking for does not exist" }} />
  }

  if (account.hasCode) {
    return <ContractDetails account={account} />
  }

  return <AccountDetails account={account} />
}
