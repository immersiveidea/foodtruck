interface Env {
  CONTENT: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const about = await context.env.CONTENT.get('about', 'json')
  return Response.json(about ?? { heading: '', paragraphs: [] })
}
