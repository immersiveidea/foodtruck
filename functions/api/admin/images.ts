import type { Logger } from '../../lib/logger'

interface Env {
  IMAGES: R2Bucket
}

interface ContextData extends Record<string, unknown> {
  logger: Logger
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export const onRequestPost: PagesFunction<Env, string, ContextData> = async (context) => {
  const logger = context.data.logger.child({ operation: 'uploadImage' })

  try {
    const formData = await context.request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      logger.warn('Upload attempted without file')
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      logger.warn('Invalid file type attempted', { fileType: file.type })
      return Response.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      logger.warn('File too large', { fileSize: file.size, maxSize: MAX_SIZE })
      return Response.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 50)
    const key = `menu/${Date.now()}-${sanitizedName}.${ext}`

    await context.env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable'
      }
    })

    logger.info('Image uploaded', { key, fileSize: file.size, fileType: file.type })
    return Response.json({ key })
  } catch (error) {
    logger.error('Upload failed', { error: error instanceof Error ? error.message : String(error) })
    return Response.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

export const onRequestDelete: PagesFunction<Env, string, ContextData> = async (context) => {
  const logger = context.data.logger.child({ operation: 'deleteImage' })

  try {
    const url = new URL(context.request.url)
    const key = url.searchParams.get('key')

    if (!key) {
      logger.warn('Delete attempted without key')
      return Response.json({ error: 'No key provided' }, { status: 400 })
    }

    await context.env.IMAGES.delete(key)

    logger.info('Image deleted', { key })
    return Response.json({ success: true })
  } catch (error) {
    logger.error('Delete failed', { error: error instanceof Error ? error.message : String(error) })
    return Response.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
