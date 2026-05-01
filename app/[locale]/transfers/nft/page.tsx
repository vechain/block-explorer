import { redirect } from 'next/navigation'

export default function NftTransfersRedirectPage() {
  redirect('/transfers?type=nft')
}
