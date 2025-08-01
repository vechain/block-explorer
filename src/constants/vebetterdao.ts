import { Txt, Keccak256 } from "@vechain/sdk-core"

// For the event signature
const eventSignature = "RewardDistributed(uint256,bytes32,address,string,address)"
const eventSignatureBytes = Txt.of(eventSignature).bytes

export const RewardDistributedEventSignature = Keccak256.of(eventSignatureBytes).toString()
