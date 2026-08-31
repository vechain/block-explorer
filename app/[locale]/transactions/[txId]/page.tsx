import { SHELL_SEGMENT } from '@/lib/constants/route-shell'
import { TransactionRoute } from './components/TransactionRoute'

export const generateStaticParams = () => [{ txId: SHELL_SEGMENT }]

export default function TransactionPage() {
  return <TransactionRoute />
}
