import type { Logger, LogContext, LogLevel } from './types'
import { LOG_LEVELS } from './types'

function getLogLevel(): LogLevel {
  // Check localStorage first (for runtime override)
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('LOG_LEVEL')
    if (stored && stored in LOG_LEVELS) {
      return stored as LogLevel
    }
  }

  // Check Vite env variable
  const envLevel = import.meta.env.VITE_LOG_LEVEL
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel as LogLevel
  }

  // Default: debug in dev, warn in prod
  return import.meta.env.DEV ? 'debug' : 'warn'
}

function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel()
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatMessage(
  level: LogLevel,
  msg: string,
  context: LogContext,
  isDev: boolean
): string | object {
  const timestamp = new Date().toISOString()

  if (isDev) {
    // Readable format for development
    const contextStr = Object.keys(context).length > 0
      ? ` ${JSON.stringify(context)}`
      : ''
    return `[${timestamp}] ${level.toUpperCase()} ${msg}${contextStr}`
  }

  // Structured JSON for production (APM collection)
  return {
    level,
    time: timestamp,
    msg,
    ...context
  }
}

function createLogger(bindings: LogContext = {}): Logger {
  const isDev = import.meta.env.DEV

  const log = (level: LogLevel, msg: string, context: LogContext = {}): void => {
    if (!shouldLog(level)) return

    const mergedContext = { ...bindings, ...context }
    const formatted = formatMessage(level, msg, mergedContext, isDev)

    const consoleMethods: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'> = {
      debug: 'debug',
      info: 'info',
      warn: 'warn',
      error: 'error'
    }

    const method = consoleMethods[level]

    if (isDev) {
      // In dev mode, use colored console output
      const colors: Record<LogLevel, string> = {
        debug: 'color: #6b7280',
        info: 'color: #3b82f6',
        warn: 'color: #f59e0b',
        error: 'color: #ef4444'
      }
      console[method](`%c${formatted}`, colors[level])
    } else {
      // In production, log structured JSON
      console[method](JSON.stringify(formatted))
    }
  }

  return {
    debug: (msg: string, context?: LogContext) => log('debug', msg, context),
    info: (msg: string, context?: LogContext) => log('info', msg, context),
    warn: (msg: string, context?: LogContext) => log('warn', msg, context),
    error: (msg: string, context?: LogContext) => log('error', msg, context),
    child: (childBindings: LogContext) => createLogger({ ...bindings, ...childBindings })
  }
}

export const browserLogger = createLogger()

export { createLogger }
