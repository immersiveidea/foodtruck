interface Env {
  CONTENT: KVNamespace
  IMAGES: R2Bucket
}

interface BackupData {
  version: number
  exportedAt: string
  content: {
    menu: unknown
    schedule: unknown
    bookings: unknown
    hero: unknown
    about: unknown
  }
  imageKeys: string[]
}

// GET /api/admin/backup - Returns all content and list of image keys
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // Get all KV content
    const [menu, schedule, bookings, hero, about] = await Promise.all([
      context.env.CONTENT.get('menu', 'json'),
      context.env.CONTENT.get('schedule', 'json'),
      context.env.CONTENT.get('bookings', 'json'),
      context.env.CONTENT.get('hero', 'json'),
      context.env.CONTENT.get('about', 'json')
    ])

    // List all images in R2
    const imageList = await context.env.IMAGES.list()
    const imageKeys = imageList.objects.map(obj => obj.key)

    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      content: {
        menu: menu ?? null,
        schedule: schedule ?? null,
        bookings: bookings ?? null,
        hero: hero ?? null,
        about: about ?? null
      },
      imageKeys
    }

    return Response.json(backup)
  } catch (error) {
    console.error('Backup error:', error)
    return Response.json({ error: 'Failed to create backup' }, { status: 500 })
  }
}
