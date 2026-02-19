import { ref } from 'vue'
import type { MenuData, ScheduleData, BookingsData, HeroContent, AboutContent, FaviconContent, SocialLinksContent, Order, SiteSettings } from '../types'
import { useAdminApi } from './useAdminApi'

const menuData = ref<MenuData>({ categories: [] })
const scheduleData = ref<ScheduleData>([])
const bookingsData = ref<BookingsData>([])
const ordersData = ref<Order[]>([])
const settingsData = ref<SiteSettings>({ onlineOrderingEnabled: false })
const heroData = ref<HeroContent>({ title: '', tagline: '', ctaText: '', ctaLink: '' })
const aboutData = ref<AboutContent>({ heading: '', paragraphs: [] })
const faviconData = ref<FaviconContent>({ hasCustomFavicon: false, siteName: '', themeColor: '#ffffff', metaDescription: '' })
const socialLinksData = ref<SocialLinksContent>({ links: [] })

async function loadAllData() {
  const { adminFetch, loading, message } = useAdminApi()
  loading.value = true
  try {
    const [menuRes, scheduleRes, bookingsRes, ordersRes, settingsRes, heroRes, aboutRes, faviconRes, socialLinksRes] = await Promise.all([
      adminFetch('/api/admin/menu'),
      adminFetch('/api/admin/schedule'),
      adminFetch('/api/admin/bookings'),
      adminFetch('/api/admin/orders'),
      adminFetch('/api/admin/settings'),
      adminFetch('/api/admin/hero'),
      adminFetch('/api/admin/about'),
      adminFetch('/api/admin/favicon'),
      adminFetch('/api/admin/sociallinks'),
    ])

    if (menuRes.ok) {
      const data = await menuRes.json()
      menuData.value = data.categories ? data : { categories: [] }
    }
    if (scheduleRes.ok) scheduleData.value = await scheduleRes.json()
    if (bookingsRes.ok) bookingsData.value = await bookingsRes.json()
    if (ordersRes.ok) ordersData.value = await ordersRes.json()
    if (settingsRes.ok) settingsData.value = await settingsRes.json()
    if (heroRes.ok) {
      const data = await heroRes.json()
      if (data.title) heroData.value = data
    }
    if (aboutRes.ok) {
      const data = await aboutRes.json()
      if (data.heading) aboutData.value = data
    }
    if (faviconRes.ok) faviconData.value = await faviconRes.json()
    if (socialLinksRes.ok) {
      const data = await socialLinksRes.json()
      if (data.links) socialLinksData.value = data
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to load data' }
  } finally {
    loading.value = false
  }
}

export function useAdminData() {
  return {
    menuData,
    scheduleData,
    bookingsData,
    ordersData,
    settingsData,
    heroData,
    aboutData,
    faviconData,
    socialLinksData,
    loadAllData,
  }
}
