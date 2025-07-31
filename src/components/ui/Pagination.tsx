import { ButtonGroup, IconButton, Pagination as PaginationChakra, PaginationRootProps } from "@chakra-ui/react"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"

export const Pagination = ({ count, pageSize, defaultPage, onPageChange, ...rest }: PaginationRootProps) => {
  return (
    <PaginationChakra.Root
      m="auto"
      count={count}
      pageSize={pageSize}
      defaultPage={defaultPage}
      onPageChange={onPageChange}
      {...rest}>
      <ButtonGroup gap="4" size="sm" variant="ghost">
        <PaginationChakra.PrevTrigger asChild>
          <IconButton>
            <LuChevronLeft />
          </IconButton>
        </PaginationChakra.PrevTrigger>
        <PaginationChakra.PageText />
        <PaginationChakra.NextTrigger asChild>
          <IconButton>
            <LuChevronRight />
          </IconButton>
        </PaginationChakra.NextTrigger>
      </ButtonGroup>
    </PaginationChakra.Root>
  )
}
