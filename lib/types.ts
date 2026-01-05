export enum TransactionDetailsView {
  TRANSACTION = 'transaction',
  CLAUSES = 'clauses',
  EVENTS = 'events',
}

export type InsightType = {
  label: string
  value: string | React.ReactNode
}
