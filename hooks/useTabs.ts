import { useRouter, useSearchParams } from 'next/navigation'

export const useTabs = (defaultValue: string) => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const tabSearchParamName = 't'

  const currentTab = searchParams.get(tabSearchParamName) || defaultValue

  const handleTabChange = (details: { value: string }) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(tabSearchParamName, details.value)
    router.push(`?${params.toString()}`)
  }

  return { currentTab, handleTabChange }
}
