interface Env {
  CONTENT: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const menu = await context.env.CONTENT.get('menu', 'json')
  return Response.json(menu ?? { categories: [] })
}
