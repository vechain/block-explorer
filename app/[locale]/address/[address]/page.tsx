import { SHELL_SEGMENT } from '@/lib/constants/route-shell'
import { AddressRoute } from './components/AddressRoute'

export const generateStaticParams = () => [{ address: SHELL_SEGMENT }]

export default function AddressPage() {
  return <AddressRoute />
}
