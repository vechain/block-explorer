import cf from 'cloudfront'

// Everything the Node server used to do with a URL: pick a locale, honour the renamed routes,
// and map the path onto the document the static export actually holds. The host decides which
// bundle answers, so one distribution serves dev and every preview.
//
// The route tables below are checked against app/[locale] by edge-router.spec.ts.

const kvs = cf.kvs()

const LOCALES = ['en', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'tr', 'de', 'zh', 'el']
const DEFAULT_LOCALE = 'en'

const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const TX_ID = /^0x[0-9a-fA-F]{64}$/
const TOKEN_ID = /^[0-9]+$/
const REVISION = /^(0x[0-9a-fA-F]{64}|[0-9]{1,9}|best|next|finalized|justified)$/

const STATIC_ROUTES = [
  '',
  'activity/blocks',
  'activity/transactions',
  'stats',
  'tokens',
  'transfers',
  'transfers/nft',
  'transfers/token',
]

// One prerendered document per locale, under a sentinel segment. The id never reaches the
// origin — the app reads it back off the browser URL.
const SHELL_ROUTES = {
  address: [ADDRESS],
  block: [REVISION],
  nft: [ADDRESS, TOKEN_ID],
  transaction: [TX_ID],
  transactions: [TX_ID],
}
const SHELL_SEGMENT = '__shell__'

const RENAMED = { account: 'address', accounts: 'address', addresses: 'address' }

// Matches what i18n/provider.tsx writes, so the edge and the app keep one cookie between them.
const DEFAULT_LOCALE_COOKIE = {
  NEXT_LOCALE: { value: DEFAULT_LOCALE, attributes: 'Path=/; Max-Age=31536000; SameSite=Lax' },
}

const NOT_FOUND_PAGE =
  '<!doctype html><html lang="en"><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found</title>' +
  '<style>body{background:#0b0c10;color:#e8e8ea;font:16px/1.5 system-ui,sans-serif;' +
  'display:flex;min-height:100vh;margin:0;align-items:center;justify-content:center;text-align:center}' +
  'a{color:#8ab4ff}</style><div><h1>404</h1><p>MESSAGE</p><p><a href="/">Go to the explorer</a></p></div>'

function notFound(message) {
  return {
    statusCode: 404,
    statusDescription: 'Not Found',
    headers: {
      'content-type': { value: 'text/html; charset=utf-8' },
      'cache-control': { value: 'public, max-age=300' },
    },
    body: NOT_FOUND_PAGE.replace('MESSAGE', message),
  }
}

function redirect(statusCode, location, cookies) {
  const response = {
    statusCode: statusCode,
    statusDescription: statusCode === 308 ? 'Permanent Redirect' : 'Temporary Redirect',
    headers: { location: { value: location || '/' } },
  }
  if (cookies) response.cookies = cookies
  return response
}

function queryString(request) {
  const parts = []
  for (const key in request.querystring) {
    const entry = request.querystring[key]
    const values = entry.multiValue || [entry]
    for (let i = 0; i < values.length; i++) {
      parts.push(values[i].value === '' ? key : key + '=' + encodeURIComponent(values[i].value))
    }
  }
  return parts.length ? '?' + parts.join('&') : ''
}

// The cookie the app writes for the locale the reader actually chose, then the browser's own
// preference. Matches what next-i18n-router resolved before the CDN took the routing over.
function preferredLocale(request) {
  const cookie = request.cookies['NEXT_LOCALE']
  if (cookie && LOCALES.indexOf(cookie.value) !== -1) return cookie.value

  const header = request.headers['accept-language']
  if (!header) return DEFAULT_LOCALE

  const offered = header.value.split(',')
  let best = DEFAULT_LOCALE
  let bestQuality = 0
  for (let i = 0; i < offered.length; i++) {
    const parts = offered[i].split(';')
    let quality = 1
    for (let j = 1; j < parts.length; j++) {
      const parameter = parts[j].trim()
      if (parameter.slice(0, 2) === 'q=') quality = parseFloat(parameter.slice(2)) || 0
    }
    const primary = parts[0].trim().toLowerCase().split('-')[0]
    if (quality > bestQuality && LOCALES.indexOf(primary) !== -1) {
      best = primary
      bestQuality = quality
    }
  }
  return best
}

async function handler(event) {
  const request = event.request

  // The await is its own statement: the 2.0 runtime rejects one in an argument list.
  let target
  try {
    const routed = await kvs.get(request.headers.host.value)
    target = JSON.parse(routed)
  } catch (error) {
    return notFound('Nothing is deployed on this host.')
  }

  const uri = request.uri

  // Per environment rather than per bundle: this is what carries APP_VERSION and the dev-mode flag.
  if (uri === '/runtime-config.json') {
    request.uri = '/' + target.config + '/runtime-config.json'
    return request
  }

  // The client router asks for the same document as .txt when it navigates; anything else
  // carrying an extension is a build asset or a public/ file.
  const suffix = uri.slice(-4) === '.txt' ? '.txt' : '.html'
  const path = suffix === '.txt' ? uri.slice(0, -4) : uri
  if (suffix === '.html' && path.slice(path.lastIndexOf('/')).indexOf('.') !== -1) {
    request.uri = '/' + target.bundle + uri
    return request
  }

  const segments = path.split('/').filter(segment => segment !== '')

  // A locale root's payload is asked for as index.txt but exported as <locale>.txt.
  if (suffix === '.txt' && segments[segments.length - 1] === 'index') segments.pop()

  for (let i = 0; i < segments.length - 1; i++) {
    if (RENAMED[segments[i]]) {
      segments[i] = RENAMED[segments[i]]
      return redirect(308, '/' + segments.join('/') + queryString(request))
    }
  }

  let locale
  if (LOCALES.indexOf(segments[0]) !== -1) {
    locale = segments.shift()
    // The default locale's documents serve unprefixed, so its prefix is a redirect, not a route.
    // Asking for it explicitly is a choice, and recording it is what stops the unprefixed path
    // this lands on negotiating straight back to an older cookie.
    if (locale === DEFAULT_LOCALE) {
      return redirect(
        307,
        '/' + segments.join('/') + (suffix === '.txt' ? '.txt' : '') + queryString(request),
        DEFAULT_LOCALE_COOKIE,
      )
    }
  } else {
    locale = preferredLocale(request)
    // `uri` rather than the segments, so a .txt payload redirects to its own payload. The root is
    // the exception: it would otherwise land on `/es/` and redirect a second time.
    if (locale !== DEFAULT_LOCALE) {
      return redirect(307, '/' + locale + (uri === '/' ? '' : uri) + queryString(request))
    }
  }

  const shell = SHELL_ROUTES[segments[0]]
  if (shell) {
    if (segments.length !== shell.length + 1) return notFound('That is not a page on this explorer.')
    for (let i = 0; i < shell.length; i++) {
      if (!shell[i].test(segments[i + 1])) return notFound('That is not a valid id.')
      segments[i + 1] = SHELL_SEGMENT
    }
  } else if (STATIC_ROUTES.indexOf(segments.join('/')) === -1) {
    return notFound('That is not a page on this explorer.')
  }

  // The locale root is a document beside its directory: en.html, not en/index.html.
  request.uri = '/' + target.bundle + '/' + locale + (segments.length ? '/' + segments.join('/') : '') + suffix
  return request
}
