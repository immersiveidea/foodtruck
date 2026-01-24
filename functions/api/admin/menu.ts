interface Env {
  CONTENT: KVNamespace
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json()
    await context.env.CONTENT.put('menu', JSON.stringify(body))
    return Response.json({ success: true })
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const menu = await context.env.CONTENT.get('menu', 'json')
  return Response.json(menu ?? { categories: [] })
}
