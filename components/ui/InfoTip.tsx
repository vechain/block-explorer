import Image from 'next/image'
import { Tooltip } from './Tooltip'

export const InfoTip = ({ tooltip }: { tooltip: string }) => {
  return (
    <Tooltip content={tooltip}>
      <Image src="/icons/info.svg" alt="Info" width={16} height={16} />
    </Tooltip>
  )
}
