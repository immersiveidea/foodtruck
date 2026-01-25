interface Env {
  IMAGES: R2Bucket
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const path = (context.params.path as string[])?.join('/') || ''

  if (!path) {
    return new Response('Not found', { status: 404 })
  }

  const object = await context.env.IMAGES.get(path)

  if (!object) {
    return new Response('Not found', { status: 404 })
  }

  const headers = new Headers()
  headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('ETag', object.httpEtag)

  return new Response(object.body, { headers })
}
