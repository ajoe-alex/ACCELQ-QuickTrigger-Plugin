const VALUE_FLAGS = new Set([
  '-H', '--header',
  '-X', '--request',
  '-d', '--data', '--data-raw', '--data-binary', '--data-ascii', '--data-urlencode',
  '--url',
  '-u', '--user',
  '-b', '--cookie',
  '-e', '--referer',
  '-A', '--user-agent',
  '-o', '--output',
])

function unquote(token) {
  if (!token) return token
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    return token.slice(1, -1)
  }
  return token
}

export function parseCurlCommand(curlText) {
  if (!curlText || !curlText.trim()) {
    throw new Error('Paste a curl command first.')
  }

  const normalized = curlText.replace(/\\\r?\n/g, ' ').trim()
  const tokens = normalized.match(/'[^']*'|"[^"]*"|\S+/g) || []

  let i = tokens[0] && tokens[0].toLowerCase() === 'curl' ? 1 : 0
  let method = null
  let url = null
  let body = null
  const headers = {}

  for (; i < tokens.length; i++) {
    const raw = tokens[i]
    if (raw.startsWith('-')) {
      if (VALUE_FLAGS.has(raw)) {
        const value = unquote(tokens[i + 1])
        i++
        if (raw === '-X' || raw === '--request') {
          method = value ? value.toUpperCase() : method
        } else if (raw === '-H' || raw === '--header') {
          const idx = value ? value.indexOf(':') : -1
          if (idx > -1) {
            headers[value.slice(0, idx).trim()] = value.slice(idx + 1).trim()
          }
        } else if (raw === '--url') {
          url = value
        } else if (['-d', '--data', '--data-raw', '--data-binary', '--data-ascii', '--data-urlencode'].includes(raw)) {
          body = value
          if (!method) method = 'POST'
        }
      }
      continue
    }
    const value = unquote(raw)
    if (!url && /^https?:\/\//i.test(value)) {
      url = value
    }
  }

  if (!url) {
    throw new Error('Could not find a URL in the curl command.')
  }

  return { method: method || 'GET', url, headers, body }
}

export function buildCurlCommand({ method, url, headers = {}, body }) {
  const parts = [`curl -X ${method}`]
  Object.entries(headers).forEach(([key, value]) => {
    parts.push(`-H '${key}: ${value}'`)
  })
  if (body) {
    parts.push(`-d '${typeof body === 'string' ? body : JSON.stringify(body)}'`)
  }
  parts.push(`'${url}'`)
  return parts.join(' \\\n  ')
}

const TRIGGER_PATH_RE = /^\/awb\/api\/[\d.]+\/([^/]+)\/([^/]+)\/test-exec\/jobs\/templates\/([^/]+)\/run\/?$/i
const RUNS_PATH_RE = /^\/awb\/api\/[\d.]+\/([^/]+)\/runs\/([^/]+)\/?$/i

export function extractTileFieldsFromCurl(curlText) {
  const parsed = parseCurlCommand(curlText)

  let urlObj
  try {
    urlObj = new URL(parsed.url)
  } catch {
    throw new Error('The curl command contains an invalid URL.')
  }

  const baseUrl = `${urlObj.protocol}//${urlObj.host}/`
  const headerEntries = Object.entries(parsed.headers)
  const findHeader = (name) => {
    const found = headerEntries.find(([key]) => key.toLowerCase() === name.toLowerCase())
    return found ? found[1] : ''
  }
  const userId = findHeader('user_id')
  const apiKey = findHeader('api_key')

  const triggerMatch = urlObj.pathname.match(TRIGGER_PATH_RE)
  if (triggerMatch) {
    const [, tenantCode, projectName, templateJobId] = triggerMatch
    return {
      fields: { baseUrl, tenantCode, projectName, templateJobId, userId, apiKey },
      note: null,
    }
  }

  const runsMatch = urlObj.pathname.match(RUNS_PATH_RE)
  if (runsMatch) {
    const [, tenantCode] = runsMatch
    return {
      fields: { baseUrl, tenantCode, userId, apiKey },
      note: 'This looks like a job-status curl command — Project Name and Template Job ID could not be detected from it, so please fill those in manually.',
    }
  }

  throw new Error(
    'This does not look like a recognized ACCELQ job curl command. Expected a "run template" URL (.../test-exec/jobs/templates/{id}/run) or a "job status" URL (.../runs/{jobPid}).'
  )
}
