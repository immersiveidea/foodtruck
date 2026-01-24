interface Env {
  ADMIN_KEY: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const authHeader = context.request.headers.get('X-Admin-Key')
  const hasEnvKey = !!context.env.ADMIN_KEY

  console.log('Auth check:', { hasEnvKey, hasAuthHeader: !!authHeader })

  if (!hasEnvKey) {
    return new Response('Server misconfigured: ADMIN_KEY not set', { status: 500 })
  }

  if (authHeader !== context.env.ADMIN_KEY) {
    return new Response('Unauthorized', { status: 401 })
  }

  return context.next()
}
