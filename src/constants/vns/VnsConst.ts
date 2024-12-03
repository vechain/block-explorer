import { NETWORK } from "@/constants/network/NetworkConst.ts"
import { ABIFunction } from "@vechain/sdk-core"

export const VNS_RESOLVER: Partial<{ [key in NETWORK]: string }> = {
  Mainnet: "0xA11413086e163e41901bb81fdc5617c975Fa5a1A",
  Testnet: "0xc403b8EA53F707d7d4de095f0A20bC491Cf2bc94",
}

export const VNS_FUNCTION_ABI_GET_ADDRESSES = new ABIFunction(
  "function getAddresses(string[] names) returns (address[] addresses)",
)
export const VNS_FUNCTION_ABI_GET_NAMES = new ABIFunction(
  "function getNames(address[] addresses) returns (string[] names)",
)
