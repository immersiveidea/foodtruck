interface Env {
  CONTENT: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const hero = await context.env.CONTENT.get('hero', 'json')
  return Response.json(hero ?? { title: '', tagline: '', ctaText: '', ctaLink: '' })
}
