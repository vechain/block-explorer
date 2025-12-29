import type { TransactionReceipt } from '@/lib/schemas/transactions'
import { EventsList } from './EventList'

export function TransactionEvents({ receipt }: { receipt: TransactionReceipt | null }) {
  if (!receipt) return null

  const eventLogs = receipt.outputs.flatMap(o => o.events)

  return <EventsList eventLogs={eventLogs} clauseIndex={0} />
}
