"use client"

import {
  ErrorBoundary as ReactErrorBoundary,
  ErrorBoundaryPropsWithComponent,
  FallbackProps,
} from "react-error-boundary"
import { Button, EmptyState, Group } from "@chakra-ui/react"
import { BiErrorCircle } from "react-icons/bi"
import { ErrorInfo, useState } from "react"

type ErrorBoundaryProps = Omit<ErrorBoundaryPropsWithComponent, "FallbackComponent"> & {
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

function DefaultFallbackComponent({ error }: { error: Error }) {
  const [showErrorDetails, setShowErrorDetails] = useState(false)

  return (
    <EmptyState.Root size="sm">
      <EmptyState.Content>
        <Group>
          <BiErrorCircle color="red" />
          <EmptyState.Title>Something went wrong 😬</EmptyState.Title>
        </Group>
        <Button variant="ghost" size="xs" onClick={() => setShowErrorDetails(s => !s)}>
          {showErrorDetails ? "Hide" : "Show"} details
        </Button>
        {showErrorDetails && <EmptyState.Description>{error.message}</EmptyState.Description>}
      </EmptyState.Content>
    </EmptyState.Root>
  )
}

function logError(error: Error, info: ErrorInfo) {
  console.error(error, info)
}
