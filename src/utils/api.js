function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').trim().replace(/\/+$/, '')
}

export function buildTriggerRequest(tile) {
  const base = normalizeBaseUrl(tile.baseUrl)
  const url = `${base}/awb/api/2.0/${tile.tenantCode}/${tile.projectName}/test-exec/jobs/templates/${tile.templateJobId}/run`
  const headers = {
    user_id: tile.userId,
    api_key: tile.apiKey,
    'Content-Type': 'application/json',
  }
  return { method: 'POST', url, headers }
}

export function buildPollRequest(tile, jobPid) {
  const base = normalizeBaseUrl(tile.baseUrl)
  const url = `${base}/awb/api/1.0/${tile.tenantCode}/runs/${jobPid}`
  const headers = {
    accept: 'application/json',
    user_id: tile.userId,
    api_key: tile.apiKey,
  }
  return { method: 'GET', url, headers }
}

async function execute(request) {
  const requestedAt = Date.now()
  try {
    const res = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
    })
    const text = await res.text()
    let body = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }
    return {
      request: { ...request, timestamp: requestedAt },
      response: {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        body,
        timestamp: Date.now(),
      },
      error: null,
    }
  } catch (err) {
    return {
      request: { ...request, timestamp: requestedAt },
      response: null,
      error:
        err && err.message
          ? `${err.message} (this often means the request was blocked by CORS or a network/connectivity issue)`
          : 'Request failed (possibly CORS or connectivity issue).',
    }
  }
}

export async function triggerJob(tile) {
  const request = buildTriggerRequest(tile)
  return execute(request)
}

export async function pollJobStatus(tile, jobPid) {
  const request = buildPollRequest(tile, jobPid)
  return execute(request)
}

const TERMINAL_STATUSES = new Set([
  'completed',
  'complete',
  'passed',
  'pass',
  'failed',
  'fail',
  'error',
  'aborted',
  'stopped',
  'cancelled',
  'canceled',
  'success',
  'finished',
  'timeout',
  'timedout',
])

export function isTerminalStatus(status) {
  if (!status) return false
  return TERMINAL_STATUSES.has(String(status).trim().toLowerCase())
}
