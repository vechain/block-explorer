'use client'

import { Field, Flex, Input } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LuSearch } from 'react-icons/lu'
import { useSearch } from '@/hooks/useSearch'
import { IconInCircle } from '../ui/IconInCircle'

export const SearchBar = () => {
  const router = useRouter()
  const { mutate: search, error, reset } = useSearch()
  const [searchTerm, setSearchTerm] = useState<string>('')

  const handleSearch = () => {
    if (!searchTerm.trim()) return
    search(searchTerm, {
      onSuccess(data) {
        router.push(data.redirectTo)
      },
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleSearch()
  }

  return (
    <Flex border="1px solid" borderColor="bg-card-surface-2" bg="bg-card-surface-2" rounded="full" p="2" gap="4">
      <IconInCircle icon={<LuSearch size={20} />} cursor="pointer" p="3" onClick={handleSearch} />
      <Field.Root as="form" onSubmit={handleSubmit} invalid={!!error} flex="1" gap="0">
        <Input
          px="0"
          rounded="none"
          type="search"
          name="q"
          h="full"
          border="none"
          placeholder="Search by ID, name or adress"
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
