interface Env {
  CONTENT: KVNamespace
}

interface FaviconContent {
  hasCustomFavicon: boolean
  siteName: string
  themeColor: string
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const data = await context.env.CONTENT.get('favicon', 'json') as FaviconContent | null

  const siteName = data?.siteName || 'Food Truck'
  const themeColor = data?.themeColor || '#ffffff'

  const manifest = {
    name: siteName,
    short_name: siteName,
    icons: [
      {
        src: '/api/images/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/api/images/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: themeColor,
    background_color: '#ffffff',
    display: 'standalone',
  }

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
