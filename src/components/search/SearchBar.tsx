import { useSearch } from "@/hooks/search/useSearch.ts"
import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Input, Text } from "@chakra-ui/react"

const SearchBar = () => {
  const { search } = useSearch()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")

  const handleSearch = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      const result = await search(searchTerm)
      if (result.error) {
        setError(result.error)
      } else {
        setError(null)
        setSearchTerm("")
        navigate(result.redirectTo)
      }
    },
    [navigate, search, searchTerm],
  )

  return (
    <Box as="form" onSubmit={handleSearch}>
      <Input type="text" placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      <Button type="submit">Search</Button>
      {error && <Text>{error}</Text>}
    </Box>
  )
}

export default SearchBar
