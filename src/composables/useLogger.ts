import { inject, provide } from 'vue'
import type { Logger, LogContext } from '../lib/logger'
import { createLogger, generateRequestId, fetchWithCorrelation } from '../lib/logger'

const LOGGER_KEY = Symbol('logger')
const REQUEST_ID_KEY = Symbol('requestId')

export function provideLogger(bindings: LogContext = {}): Logger {
  const logger = createLogger(bindings)
  provide(LOGGER_KEY, logger)
  return logger
}

export function useLogger(component?: string): Logger {
  const injectedLogger = inject<Logger | undefined>(LOGGER_KEY, undefined)
  const baseLogger = injectedLogger ?? createLogger()

  if (component) {
    return baseLogger.child({ component })
  }

  return baseLogger
}

export function provideRequestId(): string {
  const requestId = generateRequestId()
  provide(REQUEST_ID_KEY, requestId)
  return requestId
}

export function useRequestId(): string {
  return inject<string>(REQUEST_ID_KEY, generateRequestId())
}

export function useLoggedFetch(component?: string) {
  const logger = useLogger(component)
  const requestId = useRequestId()

  return async function loggedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const operation = options.method?.toUpperCase() || 'GET'

    logger.debug('Fetching', { operation, url, requestId })

    try {
      const response = await fetchWithCorrelation(url, { ...options, requestId })

      logger.debug('Response received', {
        operation,
        url,
        requestId,
        status: response.status
      })

      return response
    } catch (error) {
      logger.error('Fetch failed', {
        operation,
        url,
        requestId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}
