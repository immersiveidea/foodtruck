interface Env {
  CONTENT: KVNamespace
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json()
    await context.env.CONTENT.put('hero', JSON.stringify(body))
    return Response.json({ success: true })
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const hero = await context.env.CONTENT.get('hero', 'json')
  return Response.json(hero ?? { title: '', tagline: '', ctaText: '', ctaLink: '' })
}
