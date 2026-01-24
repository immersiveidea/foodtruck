interface Env {
  CONTENT: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const schedule = await context.env.CONTENT.get('schedule', 'json')
  return Response.json(schedule ?? [])
}
