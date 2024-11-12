import { BlockDetail, MAINNET_URL, Poll, ThorClient } from "@vechain/sdk-network"
import { useEffect, useState } from "react"

export const useLatestBlock = () => {
  const thorClient = ThorClient.at(MAINNET_URL)
  const [block, setBlock] = useState<BlockDetail | undefined>(undefined)

  useEffect(() => {
    const monitoringPoll = Poll.createEventPoll(async () => await thorClient.blocks.getBestBlockCompressed(), 3000)
      .onStart(() => console.log("Starting"))
      .onStop(() => console.log("Stopping"))
      .onData(data => {
        console.log("New block", data)
        if (data) {
          setBlock(data)
        }
      })
      .onError(error => console.error("Error", error))

    monitoringPoll.startListen()

    return () => monitoringPoll.stopListen()
  }, [])

  return block
}
