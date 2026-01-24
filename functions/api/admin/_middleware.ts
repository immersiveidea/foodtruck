interface Env {
  ADMIN_KEY: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const authHeader = context.request.headers.get('X-Admin-Key')

  if (authHeader !== context.env.ADMIN_KEY) {
    return new Response('Unauthorized', { status: 401 })
  }

  return context.next()
}
