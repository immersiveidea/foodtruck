interface Env {
  CONTENT: KVNamespace
}

interface FaviconContent {
  hasCustomFavicon: boolean
  siteName: string
  themeColor: string
  metaDescription: string
}

// GET /api/favicon - Public endpoint for favicon metadata
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const data = await context.env.CONTENT.get('favicon', 'json') as FaviconContent | null
  return Response.json(data ?? { hasCustomFavicon: false, siteName: '', themeColor: '#ffffff', metaDescription: '' })
}
