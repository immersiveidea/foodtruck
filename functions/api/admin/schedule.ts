interface Env {
  CONTENT: KVNamespace
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json()
    await context.env.CONTENT.put('schedule', JSON.stringify(body))
    return Response.json({ success: true })
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const schedule = await context.env.CONTENT.get('schedule', 'json')
  return Response.json(schedule ?? [])
}
