import { redirect } from 'next/navigation'

export default function TokenTransfersRedirectPage() {
  redirect('/transfers?type=token')
}
