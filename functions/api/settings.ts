interface Env {
  CONTENT: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const settings = await context.env.CONTENT.get('settings', 'json')
  return Response.json(settings ?? { onlineOrderingEnabled: false })
}
