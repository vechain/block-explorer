import { EmptyState } from '@chakra-ui/react'

import { AiOutlineStop } from 'react-icons/ai'

export const NoTransfers = () => {
  return <NoResults title="No transfers" description="This account has not made any transfers yet" />
}

export const NoTransactions = () => {
  return <NoResults title="No transactions" description="This account has not made any transactions yet" />
}

export const NoTokens = () => {
  return <NoResults title="No tokens" description="This account no tokens" />
}

export const NoEvents = () => {
  return <NoResults title="No events" description="This transaction has no events" />
}

export const NoContractCreation = () => {
  return <NoResults title="No contract creation" description="This clause has no contract creation" />
}

const NoResults = ({ title, description }: { title: string; description: string }) => {
  return (
    <EmptyState.Root>
      <EmptyState.Content>
        <EmptyState.Indicator>
          <AiOutlineStop />
        </EmptyState.Indicator>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>{description}</EmptyState.Description>
      </EmptyState.Content>
    </EmptyState.Root>
  )
}
