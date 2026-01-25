interface Env {
  IMAGES: R2Bucket
}

// POST /api/admin/restore-image - Restores a single image with its original key
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const formData = await context.request.formData()
    const file = formData.get('file') as File | null
    const key = formData.get('key') as string | null

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!key) {
      return Response.json({ error: 'No key provided' }, { status: 400 })
    }

    // Determine content type from file or key
    let contentType = file.type
    if (!contentType || contentType === 'application/octet-stream') {
      const ext = key.split('.').pop()?.toLowerCase()
      const typeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif'
      }
      contentType = typeMap[ext || ''] || 'image/jpeg'
    }

    await context.env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable'
      }
    })

    return Response.json({ success: true, key })
  } catch (error) {
    console.error('Restore image error:', error)
    return Response.json({ error: 'Failed to restore image' }, { status: 500 })
  }
}
