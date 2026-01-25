interface Env {
  CONTENT: KVNamespace
  IMAGES: R2Bucket
}

interface RestoreContent {
  menu?: unknown
  schedule?: unknown
  bookings?: unknown
  hero?: unknown
  about?: unknown
}

interface RestoreRequest {
  content: RestoreContent
  clearExistingImages?: boolean
}

// POST /api/admin/restore - Restores KV content
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as RestoreRequest

    if (!body.content) {
      return Response.json({ error: 'No content provided' }, { status: 400 })
    }

    const { content, clearExistingImages } = body

    // Optionally clear existing images before restore
    if (clearExistingImages) {
      const imageList = await context.env.IMAGES.list()
      await Promise.all(
        imageList.objects.map(obj => context.env.IMAGES.delete(obj.key))
      )
    }

    // Restore all KV content
    const puts: Promise<void>[] = []

    if (content.menu !== undefined) {
      puts.push(context.env.CONTENT.put('menu', JSON.stringify(content.menu)))
    }
    if (content.schedule !== undefined) {
      puts.push(context.env.CONTENT.put('schedule', JSON.stringify(content.schedule)))
    }
    if (content.bookings !== undefined) {
      puts.push(context.env.CONTENT.put('bookings', JSON.stringify(content.bookings)))
    }
    if (content.hero !== undefined) {
      puts.push(context.env.CONTENT.put('hero', JSON.stringify(content.hero)))
    }
    if (content.about !== undefined) {
      puts.push(context.env.CONTENT.put('about', JSON.stringify(content.about)))
    }

    await Promise.all(puts)

    return Response.json({
      success: true,
      message: 'Content restored successfully',
      restoredKeys: Object.keys(content).filter(k => content[k as keyof RestoreContent] !== undefined)
    })
  } catch (error) {
    console.error('Restore error:', error)
    return Response.json({ error: 'Failed to restore backup' }, { status: 500 })
  }
}
