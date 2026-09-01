import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { i18nConfig } from '@/i18n/config'
import { SHELL_SEGMENT } from '@/lib/constants/route-shell'

interface CfValue {
  value: string
}

interface CfRequest {
  uri: string
  querystring: Record<string, CfValue & { multiValue?: CfValue[] }>
  headers: Record<string, CfValue>
  cookies: Record<string, CfValue>
}

interface CfResponse {
  statusCode: number
  headers: Record<string, CfValue>
  body?: string
}

const BUNDLE = 'app-0123456789ab'

const STORE: Record<string, string> = {
  'dev.block-explorer.vechain.org': JSON.stringify({ bundle: BUNDLE, config: 'dev' }),
  'pr-7.block-explorer-preview.vechain.org': JSON.stringify({ bundle: 'app-preview', config: 'pr-7' }),
}

const cloudfront = {
  kvs: () => ({
    get: (key: string) => (key in STORE ? Promise.resolve(STORE[key]) : Promise.reject(new Error('KeyNotFound'))),
  }),
}

// CloudFront injects the `cloudfront` module and calls a top-level `handler` rather than an
// export, so the deployed source is evaluated here the same way instead of imported.
const source = readFileSync(join(process.cwd(), 'terraform/cdn/edge-router.js'), 'utf8').replace(
  "import cf from 'cloudfront'",
  '',
)

const router = new Function('cf', `${source}\nreturn { handler, LOCALES, STATIC_ROUTES, SHELL_ROUTES, SHELL_SEGMENT }`)(
  cloudfront,
) as {
  handler: (event: { request: CfRequest }) => Promise<CfRequest | CfResponse>
  LOCALES: string[]
  STATIC_ROUTES: string[]
  SHELL_ROUTES: Record<string, RegExp[]>
  SHELL_SEGMENT: string
}

interface Visit {
  host?: string
  acceptLanguage?: string
  cookieLocale?: string
  querystring?: CfRequest['querystring']
}

const visit = async (uri: string, { host, acceptLanguage, cookieLocale, querystring }: Visit = {}) => {
  const headers: CfRequest['headers'] = { host: { value: host ?? 'dev.block-explorer.vechain.org' } }
  if (acceptLanguage) headers['accept-language'] = { value: acceptLanguage }

  return router.handler({
    request: {
      uri,
      querystring: querystring ?? {},
      headers,
      cookies: cookieLocale ? { NEXT_LOCALE: { value: cookieLocale } } : {},
    },
  })
}

const uriFor = async (path: string, options?: Visit) => ((await visit(path, options)) as CfRequest).uri

const responseFor = async (path: string, options?: Visit) => (await visit(path, options)) as CfResponse

describe('edge-router', () => {
  it('serves the default locale unprefixed and its root as a sibling document', async () => {
    expect(await uriFor('/')).toBe(`/${BUNDLE}/en.html`)
    expect(await uriFor('/tokens')).toBe(`/${BUNDLE}/en/tokens.html`)
    expect(await uriFor('/activity/blocks')).toBe(`/${BUNDLE}/en/activity/blocks.html`)
  })

  it('serves a prefixed locale from its own documents', async () => {
    expect(await uriFor('/es')).toBe(`/${BUNDLE}/es.html`)
    expect(await uriFor('/es/tokens')).toBe(`/${BUNDLE}/es/tokens.html`)
  })

  it('rewrites a real id onto the shell its route prerendered', async () => {
    const address = `0x${'a'.repeat(40)}`

    expect(await uriFor(`/block/12345678`)).toBe(`/${BUNDLE}/en/block/${SHELL_SEGMENT}.html`)
    expect(await uriFor(`/block/0x${'b'.repeat(64)}`)).toBe(`/${BUNDLE}/en/block/${SHELL_SEGMENT}.html`)
    expect(await uriFor(`/es/address/${address}`)).toBe(`/${BUNDLE}/es/address/${SHELL_SEGMENT}.html`)
    expect(await uriFor(`/nft/${address}/42`)).toBe(`/${BUNDLE}/en/nft/${SHELL_SEGMENT}/${SHELL_SEGMENT}.html`)
    expect(await uriFor(`/transaction/0x${'c'.repeat(64)}`)).toBe(`/${BUNDLE}/en/transaction/${SHELL_SEGMENT}.html`)
  })

  it('serves the payload the client router asks for on a navigation', async () => {
    expect(await uriFor('/es/tokens.txt')).toBe(`/${BUNDLE}/es/tokens.txt`)
    expect(await uriFor(`/address/0x${'a'.repeat(40)}.txt`)).toBe(`/${BUNDLE}/en/address/${SHELL_SEGMENT}.txt`)
  })

  it('passes build assets and public files through under the bundle', async () => {
    expect(await uriFor('/_next/static/chunks/abc123.js')).toBe(`/${BUNDLE}/_next/static/chunks/abc123.js`)
    expect(await uriFor('/tokens/B3TR.svg')).toBe(`/${BUNDLE}/tokens/B3TR.svg`)
    expect(await uriFor('/favicon.ico')).toBe(`/${BUNDLE}/favicon.ico`)
  })

  // The router asks for a locale root's payload as index.txt; the export writes it as <locale>.txt.
  it('serves a locale root payload under the name the export gave it', async () => {
    expect(await uriFor('/index.txt')).toBe(`/${BUNDLE}/en.txt`)
    expect(await uriFor('/es/index.txt')).toBe(`/${BUNDLE}/es.txt`)
  })

  it('answers runtime config per environment rather than per bundle', async () => {
    expect(await uriFor('/runtime-config.json')).toBe('/dev/runtime-config.json')
    expect(await uriFor('/runtime-config.json', { host: 'pr-7.block-explorer-preview.vechain.org' })).toBe(
      '/pr-7/runtime-config.json',
    )
  })

  it('serves a preview from its own bundle', async () => {
    expect(await uriFor('/tokens', { host: 'pr-7.block-explorer-preview.vechain.org' })).toBe(
      '/app-preview/en/tokens.html',
    )
  })

  it.each([
    ['/accounts/0xabc', '/address/0xabc'],
    ['/account/0xabc', '/address/0xabc'],
    ['/es/addresses/0xabc', '/es/address/0xabc'],
  ])('redirects the renamed route %s', async (from, to) => {
    const response = await responseFor(from)

    expect(response.statusCode).toBe(308)
    expect(response.headers.location.value).toBe(to)
  })

  it('redirects the default locale prefix away and keeps the query', async () => {
    const response = await responseFor('/en/transfers', { querystring: { type: { value: 'nft' } } })

    expect(response.statusCode).toBe(307)
    expect(response.headers.location.value).toBe('/transfers?type=nft')
  })

  it('redirects to the reader’s locale when the path carries none', async () => {
    const response = await responseFor('/tokens', { acceptLanguage: 'fr-FR,fr;q=0.9,en;q=0.8' })

    expect(response.statusCode).toBe(307)
    expect(response.headers.location.value).toBe('/fr/tokens')
  })

  it('prefers the cookie the app wrote over the browser’s header', async () => {
    const response = await responseFor('/tokens', { acceptLanguage: 'fr', cookieLocale: 'ja' })

    expect(response.headers.location.value).toBe('/ja/tokens')
  })

  it('sends the root to a bare locale rather than one that redirects again', async () => {
    const response = await responseFor('/', { cookieLocale: 'es' })

    expect(response.headers.location.value).toBe('/es')
  })

  it('stays on the default locale for a language it does not serve', async () => {
    expect(await uriFor('/tokens', { acceptLanguage: 'nl-NL,nl;q=0.9' })).toBe(`/${BUNDLE}/en/tokens.html`)
  })

  it.each([
    ['a malformed address', '/address/nonsense'],
    ['a malformed block revision', '/block/0xdeadbeef'],
    ['a non-numeric token id', `/nft/0x${'a'.repeat(40)}/abc`],
    ['a route that does not exist', '/nonsense'],
    ['too many segments for the route', `/block/12345678/extra`],
  ])('answers 404 for %s', async (_case, path) => {
    const response = await responseFor(path)

    expect(response.statusCode).toBe(404)
    expect(response.body).toContain('404')
  })

  it('answers 404 for a host with nothing deployed', async () => {
    const response = await responseFor('/', { host: 'pr-999.block-explorer-preview.vechain.org' })

    expect(response.statusCode).toBe(404)
  })
})

// The tables are the app's route shape restated at the edge, so they have to be checked against it.
describe('edge-router route tables', () => {
  const walk = (directory: string, prefix: string[]): string[][] =>
    readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      if (entry.name === 'page.tsx') return [prefix]
      if (!entry.isDirectory() || entry.name === 'components') return []
      return walk(join(directory, entry.name), [...prefix, entry.name])
    })

  const appRoutes = () => walk(join(process.cwd(), 'app/[locale]'), [])

  const isDynamic = (segment: string) => segment.startsWith('[')

  it('lists every locale the app builds', () => {
    expect([...router.LOCALES].sort()).toEqual([...i18nConfig.locales].sort())
    expect(router.LOCALES[0]).toBe(i18nConfig.defaultLocale)
  })

  it('uses the sentinel the pages prerender under', () => {
    expect(router.SHELL_SEGMENT).toBe(SHELL_SEGMENT)
  })

  it('covers every route under app/[locale]', () => {
    const routes = appRoutes()
    const expectedStatic = routes.filter(segments => !segments.some(isDynamic)).map(segments => segments.join('/'))
    const expectedShells = Object.fromEntries(
      routes.filter(segments => segments.some(isDynamic)).map(segments => [segments[0], segments.filter(isDynamic)]),
    )

    expect([...router.STATIC_ROUTES].sort()).toEqual(expectedStatic.sort())
    expect(Object.keys(router.SHELL_ROUTES).sort()).toEqual(Object.keys(expectedShells).sort())
    for (const [route, params] of Object.entries(expectedShells)) {
      expect(router.SHELL_ROUTES[route]).toHaveLength(params.length)
    }
  })
})
