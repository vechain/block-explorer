'use client'

import { Button, Field, Input, InputGroup } from '@chakra-ui/react'
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

  const handleSearch = () => {
    search(searchTerm, {
      onSuccess: data => {
        router.push(data.redirectTo)
      },
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleSearch()
  }

  return (
    <Field.Root invalid={!!error} minW="300px">
      <InputGroup
        as="form"
        onSubmit={handleSubmit}
        endElement={
          <Button size="xs" bg="primary.500" onClick={handleSearch}>
            <LuSearch size="40px" color="white" />
          </Button>
        }
        css={{
          '& > div': { padding: '0', paddingRight: '4px' },
          '& > button': { padding: '0' },
        }}>
        <Input
          type="search"
          name="search"
          placeholder={t('search_placeholder')}
          variant="outline"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </InputGroup>
      <Field.ErrorText>{error?.message}</Field.ErrorText>
    </Field.Root>
  )
}
