import type { TransactionReceipt } from '@/lib/schemas/transactions'
import { EventsList } from './EventList'

export function TransactionEvents({
  receipt,
  expert = false,
}: {
  receipt: TransactionReceipt | null
  expert?: boolean
}) {
  if (!receipt) return null

  const eventLogs = receipt.outputs.flatMap(o => o.events)

  return <EventsList eventLogs={eventLogs} clauseIndex={0} expert={expert} />
}
