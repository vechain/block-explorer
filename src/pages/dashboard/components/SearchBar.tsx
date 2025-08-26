import { useSearch } from "@/hooks/useSearch"
import { useState } from "react"

import { InputGroup, Input, Field } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LuSearch } from "react-icons/lu"

export const SearchBar = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { mutate: search, error } = useSearch()
  const [searchTerm, setSearchTerm] = useState<string>("")

  const handleSearch = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault()
    search(searchTerm, {
      onSuccess: data => {
        navigate(data.redirectTo)
      },
    })
  }

  return (
    <Field.Root invalid={!!error}>
      <InputGroup as="form" onSubmit={handleSearch} startElement={<LuSearch />}>
        <Input
          type="search"
          name="search"
          placeholder={t("search_placeholder")}
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
