const REQUEST_ID_HEADER = 'X-Request-ID'

function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i]! % chars.length]
  }
  return result
}

export function generateRequestId(): string {
  const prefix = 'fe'
  const timestamp = Date.now().toString(36)
  const random = generateRandomString(6)
  return `${prefix}-${timestamp}-${random}`
}

export interface FetchWithCorrelationOptions extends RequestInit {
  requestId?: string
}

export function fetchWithCorrelation(
  url: string | URL | Request,
  options: FetchWithCorrelationOptions = {}
): Promise<Response> {
  const { requestId = generateRequestId(), ...fetchOptions } = options

  const headers = new Headers(fetchOptions.headers)
  headers.set(REQUEST_ID_HEADER, requestId)

  return fetch(url, {
    ...fetchOptions,
    headers
  })
}

export { REQUEST_ID_HEADER }
