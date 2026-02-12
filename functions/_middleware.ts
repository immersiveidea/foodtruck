interface Env {
  CONTENT: KVNamespace
}

interface FaviconContent {
  hasCustomFavicon: boolean
  siteName: string
  themeColor: string
  metaDescription: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const response = await context.next()

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) {
    return response
  }

  const data = await context.env.CONTENT.get('favicon', 'json') as FaviconContent | null
  const siteName = data?.siteName || 'foodtruck'
  const metaDescription = data?.metaDescription || ''

  return new HTMLRewriter()
    .on('title', {
      element(element) {
        element.setInnerContent(siteName)
      },
    })
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute('content', metaDescription)
      },
    })
    .transform(response)
}
