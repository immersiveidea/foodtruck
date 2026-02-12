import type { Logger } from '../../lib/logger'

interface Env {
  CONTENT: KVNamespace
  IMAGES: R2Bucket
}

interface ContextData extends Record<string, unknown> {
  logger: Logger
}

interface FaviconContent {
  hasCustomFavicon: boolean
  siteName: string
  themeColor: string
}

const FAVICON_KEYS = [
  'favicon/favicon.ico',
  'favicon/favicon-16x16.png',
  'favicon/favicon-32x32.png',
  'favicon/apple-touch-icon.png',
  'favicon/android-chrome-192x192.png',
  'favicon/android-chrome-512x512.png',
]

// GET /api/admin/favicon - Get favicon metadata
export const onRequestGet: PagesFunction<Env, string, ContextData> = async (context) => {
  const logger = context.data.logger.child({ operation: 'getFavicon' })

  try {
    const data = await context.env.CONTENT.get('favicon', 'json') as FaviconContent | null
    logger.info('Favicon metadata retrieved')
    return Response.json(data ?? { hasCustomFavicon: false, siteName: '', themeColor: '#ffffff' })
  } catch (error) {
    logger.error('Failed to get favicon', { error: error instanceof Error ? error.message : String(error) })
    return Response.json({ error: 'Failed to get favicon metadata' }, { status: 500 })
  }
}

// POST /api/admin/favicon - Save favicon metadata
export const onRequestPost: PagesFunction<Env, string, ContextData> = async (context) => {
  const logger = context.data.logger.child({ operation: 'saveFavicon' })

  try {
    const body = await context.request.json() as FaviconContent
    await context.env.CONTENT.put('favicon', JSON.stringify(body))
    logger.info('Favicon metadata saved')
    return Response.json({ success: true })
  } catch (error) {
    logger.error('Failed to save favicon', { error: error instanceof Error ? error.message : String(error) })
    return Response.json({ error: 'Failed to save favicon metadata' }, { status: 500 })
  }
}

// DELETE /api/admin/favicon - Remove custom favicon
export const onRequestDelete: PagesFunction<Env, string, ContextData> = async (context) => {
  const logger = context.data.logger.child({ operation: 'deleteFavicon' })

  try {
    // Delete all favicon variants from R2
    await Promise.all(FAVICON_KEYS.map(key => context.env.IMAGES.delete(key)))

    // Update KV metadata
    await context.env.CONTENT.put('favicon', JSON.stringify({
      hasCustomFavicon: false,
      siteName: '',
      themeColor: '#ffffff'
    }))

    logger.info('Favicon removed', { deletedKeys: FAVICON_KEYS.length })
    return Response.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete favicon', { error: error instanceof Error ? error.message : String(error) })
    return Response.json({ error: 'Failed to delete favicon' }, { status: 500 })
  }
}
