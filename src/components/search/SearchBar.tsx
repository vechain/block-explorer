import { useSearch } from "@/hooks/useSearch"
import { useState } from "react"

import { Box, Button, Group, Input, Text } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"

export function SearchBar() {
  const { mutate: search, error } = useSearch()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState<string>("")

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    search(searchTerm, {
      onSuccess: data => {
        navigate(data.redirectTo)
      },
    })
  }

  return (
    <form onSubmit={handleSearch}>
      <Group attached w="full" maxW="sm">
        <Input flex="1" placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <Button type="submit">Search</Button>
      </Group>
      <Box mt={2}>{error && <Text color="red.500">{error.message}</Text>}</Box>
    </form>
  )
}
