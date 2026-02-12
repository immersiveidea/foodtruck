export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  requestId?: string
  component?: string
  operation?: string
  [key: string]: unknown
}

export interface Logger {
  debug(msg: string, context?: LogContext): void
  info(msg: string, context?: LogContext): void
  warn(msg: string, context?: LogContext): void
  error(msg: string, context?: LogContext): void
  child(bindings: LogContext): Logger
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
}

const REQUEST_ID_HEADER = 'X-Request-ID'

function shouldLog(level: LogLevel, configuredLevel: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel]
}

function createWorkerLogger(bindings: LogContext = {}, logLevel: LogLevel = 'info'): Logger {
  const log = (level: LogLevel, msg: string, context: LogContext = {}): void => {
    if (!shouldLog(level, logLevel)) return

    const mergedContext = { ...bindings, ...context }
    const logEntry = {
      level,
      time: new Date().toISOString(),
      msg,
      ...mergedContext
    }

    // Always output structured JSON in Workers (captured by Cloudflare)
    console[level](JSON.stringify(logEntry))
  }

  return {
    debug: (msg: string, context?: LogContext) => log('debug', msg, context),
    info: (msg: string, context?: LogContext) => log('info', msg, context),
    warn: (msg: string, context?: LogContext) => log('warn', msg, context),
    error: (msg: string, context?: LogContext) => log('error', msg, context),
    child: (childBindings: LogContext) => createWorkerLogger({ ...bindings, ...childBindings }, logLevel)
  }
}

interface EnvWithLogLevel {
  LOG_LEVEL?: string
}

export function createRequestLogger(
  request: Request,
  env?: EnvWithLogLevel
): Logger {
  const requestId = request.headers.get(REQUEST_ID_HEADER) || generateRequestId()
  const logLevel = (env?.LOG_LEVEL as LogLevel) || 'info'

  const url = new URL(request.url)

  return createWorkerLogger(
    {
      requestId,
      method: request.method,
      path: url.pathname
    },
    logLevel
  )
}

function generateRequestId(): string {
  const prefix = 'be'
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}`
}

export { createWorkerLogger, REQUEST_ID_HEADER }
