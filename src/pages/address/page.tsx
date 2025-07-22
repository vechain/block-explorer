import { Navigate, useParams } from "react-router-dom"
import { parseAddress } from "@/utils/address"

import { useAccount } from "@/services/thor/account/hooks"
import { Address } from "@vechain/sdk-core"
import { ContractDetails } from "./components/ContractDetails"
import { AccountDetails } from "./components/AccountDetails"

export const AddressPage = () => {
  const { address } = useParams<{ address: string }>()
  const addr = parseAddress(address)

  return addr ? (
    <RenderAccountOrContract address={addr} />
  ) : (
    <Navigate to="/404" replace state={{ message: "Invalid address" }} />
  )
}

const RenderAccountOrContract = ({ address }: { address: Address }) => {
  const { data: account, isLoading: isAccountLoading } = useAccount(address)

  if (isAccountLoading) return <div>Loading...</div>

  if (!account) {
    return <Navigate to="/404" replace state={{ message: "The account you are looking for does not exist" }} />
  }

  return account.hasCode ? <ContractDetails account={account} /> : <AccountDetails account={account} />
}
