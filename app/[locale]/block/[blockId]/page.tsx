import { SHELL_SEGMENT } from '@/lib/constants/route-shell'
import { BlockRoute } from './components/BlockRoute'

export const generateStaticParams = () => [{ blockId: SHELL_SEGMENT }]

export default function BlockPage() {
  return <BlockRoute />
}
