export class UpstreamError extends Error {
  constructor(
    public source: string,
    public status: number,
  ) {
    super(`${source} responded ${status}`)
  }
}

export class NotFoundError extends Error {}
