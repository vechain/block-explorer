import { Abi } from "viem"
import { ABIEvent, Hex } from "@vechain/sdk-core"
import { useAbi } from "@/services/b32/hooks"
import { Event } from "@vechain/sdk-network"
import { decodedEventSchema, EventType, ParsedEvent, parsedRawEventSchema } from "@/schemas/events"

export function useDecodeEvent(rawEvent: Event) {
  const [signature] = rawEvent.topics

  const { data: abi, ...rest } = useAbi(signature)

  return { event: parseEvent(abi, rawEvent), ...rest }
}

function parseEvent(abi: Abi | undefined, rawEvent: Event): ParsedEvent {
  const parsedRawEvent = parsedRawEventSchema.parse({
    type: EventType.RAW,
    raw: rawEvent,
  })

  if (!abi) {
    return parsedRawEvent
  }

  const [signature] = rawEvent.topics

  for (const abiItem of abi) {
    if (abiItem.type === "event") {
      try {
        const eventAbi = new ABIEvent(abiItem)

        if (eventAbi.signatureHash === signature) {
          const decodedEvent = eventAbi.decodeEventLog({
            data: Hex.of(rawEvent.data),
            topics: rawEvent.topics.map(topic => Hex.of(topic)),
          })

          const parsedDecodedEvent = decodedEventSchema.safeParse({
            address: rawEvent.address,
            signature: eventAbi.format(),
            signatureHash: eventAbi.signatureHash,
            args: decodedEvent.args,
            name: eventAbi.signature.name,
            inputs: eventAbi.signature.inputs,
          })

          if (!parsedDecodedEvent.success) {
            console.error({ issues: parsedDecodedEvent.error.issues, decodedEvent, eventAbi })
            return parsedRawEvent
          }

          return {
            type: EventType.DECODED,
            raw: parsedRawEvent.raw,
            decoded: parsedDecodedEvent.data,
          }
        }
      } catch (_error) {
        continue
      }
    }
  }

  return parsedRawEvent
}
