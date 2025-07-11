import { useSearch } from "@/hooks/useSearch"
import { useState } from "react"

import { InputGroup, Input, Text } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LuSearch } from "react-icons/lu"

export const SearchBar = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { mutate: search, error } = useSearch()
  const [searchTerm, setSearchTerm] = useState<string>("")

  function handleSearch(e: React.FormEvent<HTMLDivElement>) {
    e.preventDefault()
    search(searchTerm, {
      onSuccess: data => {
        navigate(data.redirectTo)
      },
    })
  }

  return (
    <>
      <InputGroup as="form" onSubmit={handleSearch} startElement={<LuSearch />}>
        <Input
          type="search"
          name="search"
          placeholder={t("search_placeholder")}
          variant="subtle"
          borderRadius={6}
          p={2}
          css={{ "&:focus": { borderColor: "blue.400" } }}
          pl={4}
          bg="white"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {error && (
        <Text mt={2} color="red.500">
          {error.message}
        </Text>
      )}
    </>
  )
}
