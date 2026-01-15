'use client'

import { Field, Flex, type FlexProps, Input } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuSearch } from 'react-icons/lu'
import { useSearch } from '@/hooks/useSearch'

export const SearchBar = (props: FlexProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { mutate: search, error, reset } = useSearch()
  const [searchTerm, setSearchTerm] = useState<string>('')

  const handleSearch = () => {
    if (!searchTerm.trim()) return
    search(searchTerm, {
      onSuccess(data) {
        setSearchTerm('') // Clear the search input on successful search
        router.push(data.redirectTo)
      },
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleSearch()
  }

  return (
    <Flex
      border="1px solid"
      borderColor="border-primary"
      bg="bg-primary"
      rounded="full"
      p="3.5"
      gap="4"
      role="search"
      {...props}
    >
      <button
        type="button"
        onClick={handleSearch}
        aria-label={t('Search')}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <LuSearch size={20} color="text-primary" aria-hidden="true" />
      </button>
      <Field.Root as="form" onSubmit={handleSubmit} invalid={!!error} flex="1" gap="0">
        <Input
          px="0"
          rounded="none"
          type="search"
          name="q"
          id="search-input"
          h="full"
          border="none"
          placeholder={t('Search for blocks, transactions or accounts')}
          aria-label={t('Search for blocks, transactions or accounts')}
          variant="outline"
          textStyle="bodyM"
          focusVisibleRing="none"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            if (error) {
              reset()
            }
          }}
        />
        <Field.ErrorText>{error?.message}</Field.ErrorText>
      </Field.Root>
    </Flex>
  )
}
