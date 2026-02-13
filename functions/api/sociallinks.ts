interface Env {
  CONTENT: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const sociallinks = await context.env.CONTENT.get('sociallinks', 'json')
  return Response.json(sociallinks ?? { links: [] })
}
