interface Env {
  CONTENT: KVNamespace
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface MenuItem {
  name: string
}

interface MenuCategory {
  id: string
  items: MenuItem[]
}

interface MenuData {
  categories: MenuCategory[]
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const baseUrl = new URL(context.request.url).origin
  const menu = await context.env.CONTENT.get<MenuData>('menu', 'json')

  const urls: { loc: string; priority: string }[] = [
    { loc: '/', priority: '1.0' },
    { loc: '/menu', priority: '0.9' },
    { loc: '/book', priority: '0.7' },
  ]

  if (menu?.categories) {
    for (const category of menu.categories) {
      urls.push({ loc: `/menu/${category.id}`, priority: '0.8' })
      for (const item of category.items) {
        urls.push({ loc: `/menu/${category.id}/${toSlug(item.name)}`, priority: '0.7' })
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
