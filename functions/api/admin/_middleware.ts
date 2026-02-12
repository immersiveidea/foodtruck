import { createRequestLogger, type Logger } from '../../lib/logger'

interface Env {
  ADMIN_KEY: string
  LOG_LEVEL?: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const logger = createRequestLogger(context.request, context.env)

  // Attach logger to context.data for downstream handlers
  ;(context.data as Record<string, unknown>).logger = logger

  const authHeader = context.request.headers.get('X-Admin-Key')
  const hasEnvKey = !!context.env.ADMIN_KEY

  logger.info('Auth check', { hasEnvKey, hasAuthHeader: !!authHeader })

  if (!hasEnvKey) {
    logger.error('Server misconfigured', { error: 'ADMIN_KEY not set' })
    return new Response('Server misconfigured: ADMIN_KEY not set', { status: 500 })
  }

  if (authHeader !== context.env.ADMIN_KEY) {
    logger.warn('Unauthorized access attempt')
    return new Response('Unauthorized', { status: 401 })
  }

  logger.debug('Auth successful')
  return context.next()
}
