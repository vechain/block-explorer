export class UpstreamError extends Error {
  constructor(
    public source: string,
    public status: number,
  ) {
    super(`${source} responded ${status}`)
  }
}

export class NotFoundError extends Error {}

/** Classifies transport failures (timeout, DNS, refused) as upstream, not app, errors. */
export const fetchUpstream = async (source: string, url: string | URL, init?: RequestInit): Promise<Response> => {
  try {
    return await fetch(url, init)
  } catch (error) {
    if (error instanceof UpstreamError) throw error
    throw new UpstreamError(source, error instanceof Error && error.name === 'TimeoutError' ? 504 : 502)
  }
}
