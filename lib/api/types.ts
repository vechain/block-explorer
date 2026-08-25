export interface ApiResponse<T> {
  data?: T
  status?: number
}

export class ApiError extends Error {
  status: number
  content?: string
  response?: Response
  cause?: Error
  statusText?: string

  constructor({
    message = '',
    status,
    content,
    cause,
    response,
  }: {
    message?: string
    status: number
    content?: string
    cause?: Error
    response?: Response
  }) {
    super(message)
    // `Error.message` is non-enumerable, so JSON.stringify would drop it.
    Object.defineProperty(this, 'message', { value: message, enumerable: true, writable: true, configurable: true })
    this.name = 'ApiError'
    this.status = status
    this.response = response
    this.statusText = response?.statusText
    this.content = content
    this.cause = cause
  }
}
