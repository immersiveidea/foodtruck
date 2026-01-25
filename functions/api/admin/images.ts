interface Env {
  IMAGES: R2Bucket
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const formData = await context.request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
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

    return Response.json({ key })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url)
    const key = url.searchParams.get('key')

    if (!key) {
      return Response.json({ error: 'No key provided' }, { status: 400 })
    }

    await context.env.IMAGES.delete(key)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return Response.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
