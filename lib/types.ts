export enum TransactionDetailsView {
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
