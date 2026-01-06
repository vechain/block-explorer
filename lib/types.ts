export enum TransactionDetailsView {
  TRANSACTION = 'transaction',
  CLAUSES = 'clauses',
  EVENTS = 'events',
}

export enum TransactionStatus {
  SUCCESS = 'success',
  REVERTED = 'reverted',
  PENDING = 'pending',
}

export type InsightType = {
  label: string
  value: string | React.ReactNode
}
