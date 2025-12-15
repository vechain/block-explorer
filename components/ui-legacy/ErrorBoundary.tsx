'use client'

import { Button, EmptyState, Group } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { type ErrorInfo, useState } from 'react'
import {
  type ErrorBoundaryPropsWithComponent,
  type FallbackProps,
  ErrorBoundary as ReactErrorBoundary,
} from 'react-error-boundary'
import { BiErrorCircle } from 'react-icons/bi'

type ErrorBoundaryProps = Omit<ErrorBoundaryPropsWithComponent, 'FallbackComponent'> & {
  FallbackComponent?: (props: FallbackProps) => React.ReactNode
}

export const ErrorBoundary = (props: ErrorBoundaryProps) => {
  const FallbackComponent = props.FallbackComponent || DefaultFallbackComponent

  return (
    <ReactErrorBoundary onError={logError} FallbackComponent={FallbackComponent}>
      {props.children}
    </ReactErrorBoundary>
  )
}

const DefaultFallbackComponent = ({ error }: { error: Error }) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const { t } = useTranslation()
  return (
    <EmptyState.Root size="sm">
      <EmptyState.Content>
        <Group>
          <BiErrorCircle color="red" />
          <EmptyState.Title>{t('Something went wrong 😬')}</EmptyState.Title>
        </Group>
        <Button variant="ghost" size="xs" onClick={() => setShowErrorDetails(s => !s)}>
          {showErrorDetails ? t('Hide') : t('Show')} {t('details')}
        </Button>
        {showErrorDetails && <EmptyState.Description>{error.message}</EmptyState.Description>}
      </EmptyState.Content>
    </EmptyState.Root>
  )
}

const logError = (error: Error, info: ErrorInfo) => {
  console.error(error, info)
}
