'use client'

import { Field, Input, InputGroup } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuSearch } from 'react-icons/lu'
import { useSearch } from '@/hooks/useSearch'

export const SearchBar = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const { mutate: search, error } = useSearch()
  const [searchTerm, setSearchTerm] = useState<string>('')

  const handleSearch = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault()
    search(searchTerm, {
      onSuccess: data => {
        router.push(data.redirectTo)
      },
    })
  }

  return (
    <Field.Root invalid={!!error}>
      <InputGroup as="form" onSubmit={handleSearch} startElement={<LuSearch />}>
        <Input
          type="search"
          name="search"
          placeholder={t('search_placeholder')}
          variant="outline"
          p={2}
          pl={4}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </InputGroup>
      <Field.ErrorText>{error?.message}</Field.ErrorText>
    </Field.Root>
  )
}
