import { SHELL_SEGMENT } from '@/lib/constants/route-shell'
import { NftDetailRoute } from './components/NftDetailRoute'

export const generateStaticParams = () => [{ contractAddress: SHELL_SEGMENT, tokenId: SHELL_SEGMENT }]

export default function NftDetailPage() {
  return <NftDetailRoute />
}
