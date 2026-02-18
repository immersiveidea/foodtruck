<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import imageCompression from 'browser-image-compression'
import JSZip from 'jszip'
import type { MenuData, ScheduleData, ScheduleLocation, BookingRequest, BookingsData, HeroContent, AboutContent, MenuItem, FaviconContent, SocialLinksContent, Order, OrderStatus, SiteSettings } from '../types'
import { validateSourceImage, validateImageDimensions, generateFaviconVariants } from '../lib/favicon/generator'
import type { FaviconVariant } from '../lib/favicon/generator'
import AddressAutocomplete from '../components/AddressAutocomplete.vue'
import TimeRangePicker from '../components/TimeRangePicker.vue'
import MapPicker from '../components/MapPicker.vue'
import type { AddressSuggestion } from '../composables/useAddressSearch'
import { formatDayOfWeek, formatDisplayDate, formatTimeRange, formatTimestamp } from '../composables/useDateTimeFormat'
import { useLogger } from '../composables/useLogger'

const logger = useLogger('AdminPage')

const adminKey = ref(localStorage.getItem('adminKey') || '')
const uploadingItemIndex = ref<number | null>(null)
const isAuthenticated = ref(false)
const activeTab = ref<'menu' | 'schedule' | 'bookings' | 'orders' | 'hero' | 'about' | 'social' | 'favicon' | 'backup'>('menu')
const loading = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Menu state
const menuData = ref<MenuData>({ categories: [] })
const selectedCategoryId = ref<string | null>(null)

// Schedule state
const scheduleData = ref<ScheduleData>([])
const editingEvent = ref<ScheduleLocation | null>(null)

// Bookings state
const bookingsData = ref<BookingsData>([])
const expandedBookingId = ref<string | null>(null)

// Orders state
const ordersData = ref<Order[]>([])
const expandedOrderId = ref<string | null>(null)
const ordersFilter = ref<'all' | OrderStatus>('all')

// Settings state
const settingsData = ref<SiteSettings>({ onlineOrderingEnabled: false })

// Hero state
const heroData = ref<HeroContent>({ title: '', tagline: '', ctaText: '', ctaLink: '' })
const uploadingHeroImage = ref(false)
const heroPreviewOpen = ref(false)
const heroPreviewPosition = ref('center')
const heroPreviewScale = ref(1)

// About state
const aboutData = ref<AboutContent>({ heading: '', paragraphs: [] })

// Social links state
const socialLinksData = ref<SocialLinksContent>({ links: [] })
const socialPlatforms = [
  { slug: 'facebook', label: 'Facebook' },
  { slug: 'instagram', label: 'Instagram' },
  { slug: 'tiktok', label: 'TikTok' },
  { slug: 'x', label: 'X (Twitter)' },
  { slug: 'youtube', label: 'YouTube' },
  { slug: 'snapchat', label: 'Snapchat' },
  { slug: 'pinterest', label: 'Pinterest' },
  { slug: 'threads', label: 'Threads' },
  { slug: 'yelp', label: 'Yelp' },
  { slug: 'linktree', label: 'Linktree' },
]

// Favicon state
const faviconData = ref<FaviconContent>({ hasCustomFavicon: false, siteName: '', themeColor: '#ffffff', metaDescription: '' })
const uploadingFavicon = ref(false)
const faviconPreviewVariants = ref<FaviconVariant[]>([])

// Backup state
const backupLoading = ref(false)
const backupProgress = ref('')
const restoreFile = ref<File | null>(null)

// Preview state
const previewItem = ref<MenuItem | null>(null)
const previewImageUrl = ref<string | null>(null)
const previewPosition = ref<string>('center')
const previewScale = ref<number>(1)

const selectedCategory = computed(() =>
  menuData.value.categories.find(c => c.id === selectedCategoryId.value)
)

async function authenticate() {
  if (!adminKey.value) return

  loading.value = true
  try {
    const res = await fetch('/api/admin/menu', {
      headers: { 'X-Admin-Key': adminKey.value }
    })

    if (res.ok) {
      isAuthenticated.value = true
      localStorage.setItem('adminKey', adminKey.value)
      await loadData()
    } else {
      message.value = { type: 'error', text: 'Invalid admin key' }
      localStorage.removeItem('adminKey')
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to authenticate' }
  } finally {
    loading.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const [menuRes, scheduleRes, bookingsRes, ordersRes, settingsRes, heroRes, aboutRes, faviconRes, socialLinksRes] = await Promise.all([
      fetch('/api/admin/menu', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/schedule', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/bookings', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/orders', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/settings', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/hero', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/about', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/favicon', { headers: { 'X-Admin-Key': adminKey.value } }),
      fetch('/api/admin/sociallinks', { headers: { 'X-Admin-Key': adminKey.value } })
    ])

    if (menuRes.ok) {
      const data = await menuRes.json()
      menuData.value = data.categories ? data : { categories: [] }
      if (menuData.value.categories.length > 0) {
        selectedCategoryId.value = menuData.value.categories[0]!.id
      }
    }

    if (scheduleRes.ok) {
      scheduleData.value = await scheduleRes.json()
    }

    if (bookingsRes.ok) {
      bookingsData.value = await bookingsRes.json()
    }

    if (ordersRes.ok) {
      ordersData.value = await ordersRes.json()
    }

    if (settingsRes.ok) {
      settingsData.value = await settingsRes.json()
    }

    if (heroRes.ok) {
      const data = await heroRes.json()
      if (data.title) {
        heroData.value = data
      }
    }

    if (aboutRes.ok) {
      const data = await aboutRes.json()
      if (data.heading) {
        aboutData.value = data
      }
    }

    if (faviconRes.ok) {
      const data = await faviconRes.json()
      faviconData.value = data
    }

    if (socialLinksRes.ok) {
      const data = await socialLinksRes.json()
      if (data.links) {
        socialLinksData.value = data
      }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to load data' }
  } finally {
    loading.value = false
  }
}

async function saveMenu() {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify(menuData.value)
    })

    if (res.ok) {
      message.value = { type: 'success', text: 'Menu saved successfully' }
    } else {
      message.value = { type: 'error', text: 'Failed to save menu' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save menu' }
  } finally {
    loading.value = false
  }
}

async function persistSchedule(): Promise<boolean> {
  const res = await fetch('/api/admin/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey.value
    },
    body: JSON.stringify(scheduleData.value)
  })
  return res.ok
}

async function saveSchedule() {
  loading.value = true
  message.value = null
  try {
    if (await persistSchedule()) {
      message.value = { type: 'success', text: 'Schedule saved successfully' }
    } else {
      message.value = { type: 'error', text: 'Failed to save schedule' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save schedule' }
  } finally {
    loading.value = false
  }
}

async function saveHero() {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/hero', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify(heroData.value)
    })

    if (res.ok) {
      message.value = { type: 'success', text: 'Hero content saved successfully' }
    } else {
      message.value = { type: 'error', text: 'Failed to save hero content' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save hero content' }
  } finally {
    loading.value = false
  }
}

async function uploadHeroImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    message.value = { type: 'error', text: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }
    input.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    message.value = { type: 'error', text: 'File too large. Maximum size is 5MB.' }
    input.value = ''
    return
  }

  uploadingHeroImage.value = true
  message.value = null

  try {
    // Compress image before upload - use larger dimensions for hero
    const compressionOptions = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp' as const,
      initialQuality: 0.85
    }
    const compressedFile = await imageCompression(file, compressionOptions)

    if (heroData.value.imageKey) {
      await deleteImageFromR2(heroData.value.imageKey)
    }

    const formData = new FormData()
    formData.append('file', compressedFile)

    const res = await fetch('/api/admin/images', {
      method: 'POST',
      headers: { 'X-Admin-Key': adminKey.value },
      body: formData
    })

    if (res.ok) {
      const data = await res.json() as { key: string }
      heroData.value.imageKey = data.key
      message.value = { type: 'success', text: 'Hero image uploaded. Click "Save Hero" to persist.' }
    } else {
      const error = await res.json() as { error: string }
      message.value = { type: 'error', text: error.error || 'Failed to upload image' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to upload hero image' }
  } finally {
    uploadingHeroImage.value = false
    input.value = ''
  }
}

async function removeHeroImage() {
  if (!heroData.value.imageKey) return

  try {
    await deleteImageFromR2(heroData.value.imageKey)
    heroData.value.imageKey = undefined
    heroData.value.imagePosition = undefined
    heroData.value.imageScale = undefined
    message.value = { type: 'success', text: 'Hero image removed. Click "Save Hero" to persist.' }
  } catch {
    message.value = { type: 'error', text: 'Failed to remove hero image' }
  }
}

function showHeroPreview() {
  heroPreviewPosition.value = heroData.value.imagePosition || 'center'
  heroPreviewScale.value = heroData.value.imageScale || 1
  heroPreviewOpen.value = true
}

function closeHeroPreview() {
  heroPreviewOpen.value = false
}

function applyHeroPosition() {
  heroData.value.imagePosition = heroPreviewPosition.value
  heroData.value.imageScale = heroPreviewScale.value
  message.value = { type: 'success', text: 'Image settings updated. Click "Save Hero" to persist.' }
  closeHeroPreview()
}

async function saveAbout() {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/about', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify(aboutData.value)
    })

    if (res.ok) {
      message.value = { type: 'success', text: 'About content saved successfully' }
    } else {
      message.value = { type: 'error', text: 'Failed to save about content' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save about content' }
  } finally {
    loading.value = false
  }
}

async function saveSocialLinks() {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/sociallinks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify(socialLinksData.value)
    })

    if (res.ok) {
      message.value = { type: 'success', text: 'Social links saved successfully' }
    } else {
      message.value = { type: 'error', text: 'Failed to save social links' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save social links' }
  } finally {
    loading.value = false
  }
}

function addSocialLink() {
  socialLinksData.value.links.push({ platform: 'facebook', url: '', showInHeader: false, showInFooter: true })
}

function removeSocialLink(index: number) {
  socialLinksData.value.links.splice(index, 1)
}

// Favicon functions
async function saveFavicon() {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/favicon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify(faviconData.value)
    })

    if (res.ok) {
      message.value = { type: 'success', text: 'Favicon settings saved successfully' }
    } else {
      message.value = { type: 'error', text: 'Failed to save favicon settings' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save favicon settings' }
  } finally {
    loading.value = false
  }
}

async function uploadFavicon(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const typeError = validateSourceImage(file)
  if (typeError) {
    message.value = { type: 'error', text: typeError }
    input.value = ''
    return
  }

  uploadingFavicon.value = true
  message.value = null

  try {
    const dimError = await validateImageDimensions(file)
    if (dimError) {
      message.value = { type: 'error', text: dimError }
      uploadingFavicon.value = false
      input.value = ''
      return
    }

    // Generate all variants client-side
    const variants = await generateFaviconVariants(file)
    faviconPreviewVariants.value = variants

    // Upload each variant to R2 using the restore-image endpoint
    for (const variant of variants) {
      const formData = new FormData()
      formData.append('file', variant.blob, variant.key.split('/').pop() || 'favicon.png')
      formData.append('key', variant.key)

      const res = await fetch('/api/admin/restore-image', {
        method: 'POST',
        headers: { 'X-Admin-Key': adminKey.value },
        body: formData
      })

      if (!res.ok) {
        throw new Error(`Failed to upload ${variant.key}`)
      }
    }

    // Update metadata
    faviconData.value.hasCustomFavicon = true
    await saveFavicon()

    message.value = { type: 'success', text: 'Favicon uploaded and all variants generated successfully' }
  } catch (err) {
    logger.error('Favicon upload failed', { error: err instanceof Error ? err.message : String(err) })
    message.value = { type: 'error', text: 'Failed to upload favicon' }
  } finally {
    uploadingFavicon.value = false
    input.value = ''
  }
}

async function removeFavicon() {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/favicon', {
      method: 'DELETE',
      headers: { 'X-Admin-Key': adminKey.value }
    })

    if (res.ok) {
      faviconData.value.hasCustomFavicon = false
      faviconPreviewVariants.value = []
      message.value = { type: 'success', text: 'Custom favicon removed' }
    } else {
      message.value = { type: 'error', text: 'Failed to remove favicon' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to remove favicon' }
  } finally {
    loading.value = false
  }
}

function addParagraph() {
  aboutData.value.paragraphs.push('')
}

function removeParagraph(index: number) {
  aboutData.value.paragraphs.splice(index, 1)
}

function addCategory() {
  const id = `category-${Date.now()}`
  menuData.value.categories.push({
    id,
    name: 'New Category',
    items: []
  })
  selectedCategoryId.value = id
}

function removeCategory(id: string) {
  menuData.value.categories = menuData.value.categories.filter(c => c.id !== id)
  if (selectedCategoryId.value === id) {
    selectedCategoryId.value = menuData.value.categories[0]?.id ?? null
  }
}

function addMenuItem() {
  if (!selectedCategory.value) return
  selectedCategory.value.items.push({
    name: 'New Item',
    description: '',
    price: 0
  })
}

function removeMenuItem(index: number) {
  if (!selectedCategory.value) return
  const item = selectedCategory.value.items[index]
  if (item?.imageKey) {
    deleteImageFromR2(item.imageKey)
  }
  selectedCategory.value.items.splice(index, 1)
}

async function uploadImage(event: Event, item: MenuItem, index: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    message.value = { type: 'error', text: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }
    input.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    message.value = { type: 'error', text: 'File too large. Maximum size is 5MB.' }
    input.value = ''
    return
  }

  uploadingItemIndex.value = index
  message.value = null

  try {
    // Compress image before upload
    const compressionOptions = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/webp' as const,
      initialQuality: 0.8
    }
    const compressedFile = await imageCompression(file, compressionOptions)

    if (item.imageKey) {
      await deleteImageFromR2(item.imageKey)
    }

    const formData = new FormData()
    formData.append('file', compressedFile)

    const res = await fetch('/api/admin/images', {
      method: 'POST',
      headers: { 'X-Admin-Key': adminKey.value },
      body: formData
    })

    if (res.ok) {
      const data = await res.json() as { key: string }
      item.imageKey = data.key
      message.value = { type: 'success', text: 'Image uploaded. Click "Save Menu" to persist.' }
    } else {
      const error = await res.json() as { error: string }
      message.value = { type: 'error', text: error.error || 'Failed to upload image' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to upload image' }
  } finally {
    uploadingItemIndex.value = null
    input.value = ''
  }
}

async function deleteImageFromR2(key: string) {
  try {
    await fetch(`/api/admin/images?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': adminKey.value }
    })
  } catch (e) {
    logger.error('Failed to delete image from R2', { key, error: e instanceof Error ? e.message : String(e) })
  }
}

async function removeImage(item: MenuItem) {
  if (!item.imageKey) return

  try {
    await deleteImageFromR2(item.imageKey)
    item.imageKey = undefined
    message.value = { type: 'success', text: 'Image removed. Click "Save Menu" to persist.' }
  } catch {
    message.value = { type: 'error', text: 'Failed to remove image' }
  }
}

function showPreview(item: MenuItem) {
  previewItem.value = item
  previewImageUrl.value = item.imageKey ? `/api/images/${item.imageKey}` : null
  previewPosition.value = item.imagePosition || 'center'
  previewScale.value = item.imageScale || 1
}

function closePreview() {
  previewItem.value = null
  previewImageUrl.value = null
}

function applyPosition() {
  if (previewItem.value) {
    previewItem.value.imagePosition = previewPosition.value
    previewItem.value.imageScale = previewScale.value
    message.value = { type: 'success', text: 'Image settings updated. Click "Save Menu" to persist.' }
  }
  closePreview()
}

function exportMenu() {
  const json = JSON.stringify(menuData.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'menu.json'
  a.click()
  URL.revokeObjectURL(url)
}

const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport() {
  fileInput.value?.click()
}

function importMenu(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.categories && Array.isArray(data.categories)) {
        menuData.value = data
        if (menuData.value.categories.length > 0) {
          selectedCategoryId.value = menuData.value.categories[0]!.id
        }
        message.value = { type: 'success', text: 'Menu imported successfully. Click "Save Menu" to persist changes.' }
      } else {
        message.value = { type: 'error', text: 'Invalid menu format. Expected { categories: [...] }' }
      }
    } catch {
      message.value = { type: 'error', text: 'Failed to parse JSON file' }
    }
  }
  reader.readAsText(file)
  input.value = ''
}

// Event pricing state
const showEventPricing = ref(false)

function addScheduleEvent() {
  const newId = Math.max(0, ...scheduleData.value.map(e => e.id)) + 1
  // Default to tomorrow's date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]

  showEventPricing.value = false
  editingEvent.value = {
    id: newId,
    date: defaultDate!,
    startTime: '11:00',
    endTime: '15:00',
    location: '',
    address: '',
    lat: 40.48,
    lng: -104.90,
    duration: '',
    private: false
  }
}

// Date/time formatting functions imported from useDateTimeFormat composable

function saveScheduleEvent() {
  if (!editingEvent.value) return

  const existingIndex = scheduleData.value.findIndex(e => e.id === editingEvent.value!.id)
  if (existingIndex >= 0) {
    scheduleData.value.splice(existingIndex, 1, editingEvent.value)
  } else {
    scheduleData.value.push(editingEvent.value)
  }
  editingEvent.value = null
}

function onAddressSelect(suggestion: AddressSuggestion) {
  if (!editingEvent.value) return
  // Auto-fill lat/lng from the selected address
  editingEvent.value.lat = parseFloat(suggestion.lat)
  editingEvent.value.lng = parseFloat(suggestion.lon)
}

function editScheduleEvent(event: ScheduleLocation) {
  editingEvent.value = JSON.parse(JSON.stringify(event))
  showEventPricing.value = !!(event.priceOverrides && Object.keys(event.priceOverrides).length > 0)
}

function getOverridePrice(categoryId: string, itemName: string): number | null {
  const key = `${categoryId}:${itemName}`
  return editingEvent.value?.priceOverrides?.[key] ?? null
}

function setOverridePrice(categoryId: string, itemName: string, value: string) {
  if (!editingEvent.value) return
  const key = `${categoryId}:${itemName}`
  if (value === '' || value === null || value === undefined) {
    if (editingEvent.value.priceOverrides) {
      delete editingEvent.value.priceOverrides[key]
      if (Object.keys(editingEvent.value.priceOverrides).length === 0) {
        delete editingEvent.value.priceOverrides
      }
    }
  } else {
    if (!editingEvent.value.priceOverrides) {
      editingEvent.value.priceOverrides = {}
    }
    editingEvent.value.priceOverrides[key] = parseFloat(value)
  }
}

function clearAllOverrides() {
  if (!editingEvent.value) return
  delete editingEvent.value.priceOverrides
}

function removeScheduleEvent(id: number) {
  scheduleData.value = scheduleData.value.filter(e => e.id !== id)
}

// Bookings functions
const sortedBookings = computed(() => {
  return [...bookingsData.value].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

function toggleBooking(id: string) {
  expandedBookingId.value = expandedBookingId.value === id ? null : id
}

async function updateBookingStatus(booking: BookingRequest, status: 'pending' | 'confirmed' | 'denied') {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify({
        id: booking.id,
        status,
        adminNotes: booking.adminNotes,
        private: booking.private
      })
    })

    if (res.ok) {
      booking.status = status
      try {
        await syncScheduleFromBooking(booking, status)
        message.value = { type: 'success', text: 'Booking updated and schedule synced' }
      } catch {
        message.value = { type: 'error', text: 'Booking updated but failed to sync schedule' }
      }
    } else {
      message.value = { type: 'error', text: 'Failed to update booking' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to update booking' }
  } finally {
    loading.value = false
  }
}

async function syncScheduleFromBooking(booking: BookingRequest, status: 'pending' | 'confirmed' | 'denied') {
  const existingIndex = scheduleData.value.findIndex(e => e.bookingId === booking.id)

  if (status === 'confirmed') {
    if (existingIndex >= 0) {
      // Update existing schedule event
      const existing = scheduleData.value[existingIndex]!
      existing.date = booking.eventDate
      existing.startTime = booking.startTime
      existing.endTime = booking.endTime
      existing.location = booking.location
      existing.address = booking.address
      existing.private = booking.private || false
    } else {
      // Create new schedule event from booking
      const newId = Math.max(0, ...scheduleData.value.map(e => e.id)) + 1
      scheduleData.value.push({
        id: newId,
        date: booking.eventDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        location: booking.location,
        address: booking.address,
        lat: 40.48,
        lng: -104.90,
        private: booking.private || false,
        bookingId: booking.id
      })
    }
  } else {
    // Remove schedule event linked to this booking
    if (existingIndex >= 0) {
      scheduleData.value.splice(existingIndex, 1)
    } else {
      return // Nothing to remove, skip the save
    }
  }

  const ok = await persistSchedule()
  if (!ok) {
    throw new Error('Failed to save schedule')
  }
}

async function saveBooking(booking: BookingRequest) {
  await updateBookingStatus(booking, booking.status)
}

// formatTimestamp imported from useDateTimeFormat composable

// Settings functions
async function toggleOnlineOrdering() {
  settingsData.value.onlineOrderingEnabled = !settingsData.value.onlineOrderingEnabled
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify(settingsData.value)
    })

    if (res.ok) {
      message.value = { type: 'success', text: `Online ordering ${settingsData.value.onlineOrderingEnabled ? 'enabled' : 'disabled'}` }
    } else {
      settingsData.value.onlineOrderingEnabled = !settingsData.value.onlineOrderingEnabled
      message.value = { type: 'error', text: 'Failed to update settings' }
    }
  } catch {
    settingsData.value.onlineOrderingEnabled = !settingsData.value.onlineOrderingEnabled
    message.value = { type: 'error', text: 'Failed to update settings' }
  } finally {
    loading.value = false
  }
}

// Orders functions
const filteredOrders = computed(() => {
  const sorted = [...ordersData.value].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  if (ordersFilter.value === 'all') return sorted
  return sorted.filter(o => o.status === ordersFilter.value)
})

function toggleOrder(id: string) {
  expandedOrderId.value = expandedOrderId.value === id ? null : id
}

async function updateOrderStatus(order: Order, status: OrderStatus) {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify({
        id: order.id,
        status,
        adminNotes: order.adminNotes
      })
    })

    if (res.ok) {
      order.status = status
      order.updatedAt = new Date().toISOString()
      message.value = { type: 'success', text: `Order marked as ${status}` }
    } else {
      message.value = { type: 'error', text: 'Failed to update order' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to update order' }
  } finally {
    loading.value = false
  }
}

async function saveOrderNotes(order: Order) {
  loading.value = true
  message.value = null
  try {
    const res = await fetch('/api/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify({
        id: order.id,
        adminNotes: order.adminNotes
      })
    })

    if (res.ok) {
      message.value = { type: 'success', text: 'Notes saved' }
    } else {
      message.value = { type: 'error', text: 'Failed to save notes' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to save notes' }
  } finally {
    loading.value = false
  }
}

// Backup functions
async function createBackup() {
  backupLoading.value = true
  backupProgress.value = 'Fetching content...'
  message.value = null

  try {
    // Fetch backup data (content + image list)
    const res = await fetch('/api/admin/backup', {
      headers: { 'X-Admin-Key': adminKey.value }
    })

    if (!res.ok) {
      throw new Error('Failed to fetch backup data')
    }

    const backupData = await res.json()
    const zip = new JSZip()

    // Add content.json to zip
    zip.file('content.json', JSON.stringify(backupData.content, null, 2))

    // Download and add each image
    const imageKeys: string[] = backupData.imageKeys || []
    for (let i = 0; i < imageKeys.length; i++) {
      const key = imageKeys[i]
      backupProgress.value = `Downloading image ${i + 1}/${imageKeys.length}...`

      try {
        const imgRes = await fetch(`/api/images/${key}`)
        if (imgRes.ok) {
          const blob = await imgRes.blob()
          zip.file(`images/${key}`, blob)
        }
      } catch (imgErr) {
        logger.warn('Failed to download image', { key, error: imgErr instanceof Error ? imgErr.message : String(imgErr) })
      }
    }

    // Generate and download zip
    backupProgress.value = 'Creating zip file...'
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    const date = new Date().toISOString().split('T')[0]
    const filename = `foodtruck-backup-${date}.zip`

    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    message.value = { type: 'success', text: 'Backup downloaded successfully' }
  } catch (error) {
    logger.error('Backup failed', { error: error instanceof Error ? error.message : String(error) })
    message.value = { type: 'error', text: 'Failed to create backup' }
  } finally {
    backupLoading.value = false
    backupProgress.value = ''
  }
}

function onRestoreFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  restoreFile.value = input.files?.[0] || null
}

async function restoreBackup() {
  if (!restoreFile.value) {
    message.value = { type: 'error', text: 'Please select a backup file' }
    return
  }

  backupLoading.value = true
  backupProgress.value = 'Reading backup file...'
  message.value = null

  try {
    const zip = await JSZip.loadAsync(restoreFile.value)

    // Read content.json
    const contentFile = zip.file('content.json')
    if (!contentFile) {
      throw new Error('Invalid backup: content.json not found')
    }

    const contentJson = await contentFile.async('string')
    const content = JSON.parse(contentJson)

    // Restore content via API
    backupProgress.value = 'Restoring content...'
    const contentRes = await fetch('/api/admin/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey.value
      },
      body: JSON.stringify({ content, clearExistingImages: true })
    })

    if (!contentRes.ok) {
      throw new Error('Failed to restore content')
    }

    // Restore images
    const imagesFolder = zip.folder('images')
    if (imagesFolder) {
      const imageFiles: { key: string; file: JSZip.JSZipObject }[] = []
      imagesFolder.forEach((relativePath, file) => {
        if (!file.dir) {
          imageFiles.push({ key: relativePath, file })
        }
      })

      for (let i = 0; i < imageFiles.length; i++) {
        const { key, file } = imageFiles[i]!
        backupProgress.value = `Restoring image ${i + 1}/${imageFiles.length}...`

        try {
          const blob = await file.async('blob')
          const formData = new FormData()
          formData.append('file', blob, key.split('/').pop() || 'image')
          formData.append('key', key)

          await fetch('/api/admin/restore-image', {
            method: 'POST',
            headers: { 'X-Admin-Key': adminKey.value },
            body: formData
          })
        } catch (imgErr) {
          logger.warn('Failed to restore image', { key, error: imgErr instanceof Error ? imgErr.message : String(imgErr) })
        }
      }
    }

    // Reload all data
    backupProgress.value = 'Reloading data...'
    await loadData()

    message.value = { type: 'success', text: 'Backup restored successfully' }
    restoreFile.value = null
  } catch (error) {
    logger.error('Restore failed', { error: error instanceof Error ? error.message : String(error) })
    message.value = { type: 'error', text: `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}` }
  } finally {
    backupLoading.value = false
    backupProgress.value = ''
  }
}

function logout() {
  isAuthenticated.value = false
  adminKey.value = ''
  localStorage.removeItem('adminKey')
}

onMounted(() => {
  if (adminKey.value) {
    authenticate()
  }
})
</script>

<template>
  <div class="min-h-screen bg-neutral-100">
    <!-- Header -->
    <header class="bg-neutral-900 text-white py-4 px-6">
      <div class="max-w-4xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-semibold">Admin Dashboard</h1>
        <div class="flex items-center gap-4">
          <router-link to="/" class="text-neutral-300 hover:text-white text-sm">
            View Site
          </router-link>
          <button
            v-if="isAuthenticated"
            @click="logout"
            class="text-neutral-300 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto py-8 px-4">
      <!-- Message -->
      <div
        v-if="message"
        :class="[
          'mb-6 p-4 rounded-lg',
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        ]"
      >
        {{ message.text }}
      </div>

      <!-- Login Form -->
      <div v-if="!isAuthenticated" class="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
        <h2 class="text-xl font-semibold mb-6">Admin Login</h2>
        <form @submit.prevent="authenticate">
          <label class="block mb-4">
            <span class="text-sm text-neutral-600">Admin Key</span>
            <input
              v-model="adminKey"
              type="password"
              class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
              placeholder="Enter admin key"
            />
          </label>
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-2 px-4 rounded-lg hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Authenticating...' : 'Login' }}
          </button>
        </form>
      </div>

      <!-- Admin Panel -->
      <div v-else>
        <!-- Tabs -->
        <div class="flex gap-2 mb-6">
          <button
            @click="activeTab = 'menu'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'menu'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Menu
          </button>
          <button
            @click="activeTab = 'schedule'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'schedule'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Schedule
          </button>
          <button
            @click="activeTab = 'bookings'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'bookings'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Bookings
            <span
              v-if="bookingsData.filter(b => b.status === 'pending').length > 0"
              class="ml-1 px-2 py-0.5 text-xs rounded-full bg-yellow-500 text-white"
            >
              {{ bookingsData.filter(b => b.status === 'pending').length }}
            </span>
          </button>
          <button
            @click="activeTab = 'orders'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'orders'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Orders
            <span
              v-if="ordersData.filter(o => o.status === 'paid').length > 0"
              class="ml-1 px-2 py-0.5 text-xs rounded-full bg-green-500 text-white"
            >
              {{ ordersData.filter(o => o.status === 'paid').length }}
            </span>
          </button>
          <button
            @click="activeTab = 'hero'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'hero'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Hero
          </button>
          <button
            @click="activeTab = 'about'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'about'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            About
          </button>
          <button
            @click="activeTab = 'social'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'social'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Social
          </button>
          <button
            @click="activeTab = 'favicon'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'favicon'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Favicon
          </button>
          <button
            @click="activeTab = 'backup'"
            :class="[
              'px-4 py-2 rounded-lg font-medium',
              activeTab === 'backup'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            ]"
          >
            Backup
          </button>
        </div>

        <!-- Menu Editor -->
        <div v-if="activeTab === 'menu'" class="space-y-6">
          <!-- Import/Export -->
          <div class="bg-white rounded-lg shadow p-4 flex justify-between items-center">
            <span class="text-sm text-neutral-600">Bulk update menu via JSON file</span>
            <div class="flex gap-2">
              <button
                @click="exportMenu"
                class="text-sm border border-neutral-300 text-neutral-700 px-3 py-1 rounded hover:bg-neutral-50"
              >
                Export JSON
              </button>
              <button
                @click="triggerImport"
                class="text-sm border border-neutral-300 text-neutral-700 px-3 py-1 rounded hover:bg-neutral-50"
              >
                Import JSON
              </button>
              <input
                ref="fileInput"
                type="file"
                accept=".json,application/json"
                class="hidden"
                @change="importMenu"
              />
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold">Categories</h2>
              <button
                @click="addCategory"
                class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800"
              >
                Add Category
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="category in menuData.categories"
                :key="category.id"
                @click="selectedCategoryId = category.id"
                :class="[
                  'px-3 py-1 rounded-full text-sm border',
                  selectedCategoryId === category.id
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                ]"
              >
                {{ category.name }}{{ category.default ? ' ★' : '' }}
              </button>
            </div>
          </div>

          <div v-if="selectedCategory" class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <input
                v-model="selectedCategory.name"
                class="text-lg font-semibold border-b border-transparent focus:border-neutral-300 focus:outline-none"
              />
              <div class="flex gap-2">
                <button
                  @click="addMenuItem"
                  class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800"
                >
                  Add Item
                </button>
                <button
                  @click="removeCategory(selectedCategory.id)"
                  class="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete Category
                </button>
              </div>
            </div>

            <label class="flex items-center gap-2 mb-4 text-sm text-neutral-600">
              <input type="checkbox" v-model="selectedCategory.default" class="rounded" />
              Show on initial load
            </label>

            <div class="space-y-4">
              <div
                v-for="(item, index) in selectedCategory.items"
                :key="index"
                class="border border-neutral-200 rounded-lg p-4"
              >
                <div class="flex justify-between items-start mb-2">
                  <input
                    v-model="item.name"
                    class="font-medium border-b border-transparent focus:border-neutral-300 focus:outline-none flex-1"
                    placeholder="Item name"
                  />
                  <div class="flex items-center gap-2 ml-4">
                    <span class="text-neutral-500">$</span>
                    <input
                      v-model.number="item.price"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-20 font-medium border border-neutral-200 rounded px-2 py-1 focus:border-neutral-400 focus:outline-none"
                      placeholder="0.00"
                    />
                    <button
                      @click="removeMenuItem(index)"
                      class="text-red-600 hover:text-red-700 text-sm ml-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <textarea
                  v-model="item.description"
                  rows="2"
                  class="w-full text-sm text-neutral-600 border border-neutral-200 rounded px-2 py-1 focus:border-neutral-400 focus:outline-none mb-3"
                  placeholder="Item description (optional)"
                ></textarea>

                <!-- Image Upload -->
                <div class="flex items-center gap-3">
                  <div
                    v-if="item.imageKey"
                    class="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-200"
                  >
                    <img
                      :src="`/api/images/${item.imageKey}`"
                      :alt="item.name"
                      class="w-full h-full object-cover"
                    />
                    <button
                      @click="removeImage(item)"
                      class="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-700"
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                  <label class="cursor-pointer">
                    <span
                      :class="[
                        'inline-block text-sm px-3 py-1 rounded border',
                        uploadingItemIndex === index
                          ? 'bg-neutral-100 text-neutral-400 border-neutral-200'
                          : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                      ]"
                    >
                      {{ uploadingItemIndex === index ? 'Uploading...' : (item.imageKey ? 'Change Image' : 'Add Image') }}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      class="hidden"
                      :disabled="uploadingItemIndex === index"
                      @change="uploadImage($event, item, index)"
                    />
                  </label>
                  <button
                    v-if="item.imageKey"
                    @click="showPreview(item)"
                    class="text-sm text-neutral-600 border border-neutral-300 px-3 py-1 rounded hover:bg-neutral-50"
                  >
                    Preview
                  </button>
                  <span class="text-xs text-neutral-400">JPEG, PNG, or WebP (max 5MB)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Menu Footer Text -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-2">Menu Footer</h2>
            <p class="text-sm text-neutral-500 mb-4">Optional text displayed below the menu items (e.g., toppings info, specials).</p>
            <textarea
              v-model="menuData.footerText"
              rows="2"
              class="w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none text-sm"
              placeholder="Add tapioca pearls, popping boba, grass jelly, or other toppings to any drink!"
            ></textarea>
          </div>

          <button
            @click="saveMenu"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save Menu' }}
          </button>
        </div>

        <!-- Schedule Editor -->
        <div v-if="activeTab === 'schedule'" class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold">Schedule Events</h2>
              <button
                @click="addScheduleEvent"
                class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800"
              >
                Add Event
              </button>
            </div>

            <!-- Event Editor Modal -->
            <div v-if="editingEvent" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 class="text-lg font-semibold mb-4">
                  {{ scheduleData.find(e => e.id === editingEvent?.id) ? 'Edit Event' : 'New Event' }}
                </h3>

                <div class="space-y-4">
                  <label class="block">
                    <span class="text-sm text-neutral-600">Date</span>
                    <input
                      v-model="editingEvent.date"
                      type="date"
                      class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                    />
                    <span v-if="editingEvent.date" class="text-xs text-neutral-400 mt-1">
                      {{ formatDayOfWeek(editingEvent.date) }}
                    </span>
                  </label>

                  <label class="flex items-center gap-2">
                    <input
                      v-model="editingEvent.private"
                      type="checkbox"
                      class="rounded border-neutral-300"
                    />
                    <span class="text-sm text-neutral-600">Private Event</span>
                    <span class="text-xs text-neutral-400">(hides location on public site)</span>
                  </label>

                  <TimeRangePicker
                    v-model:start-time="editingEvent.startTime"
                    v-model:end-time="editingEvent.endTime"
                  />

                  <label class="block">
                    <span class="text-sm text-neutral-600">Duration (optional)</span>
                    <input
                      v-model="editingEvent.duration"
                      class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                      placeholder="e.g., 4 hours"
                    />
                    <span class="text-xs text-neutral-400 mt-1">Descriptive duration for display</span>
                  </label>

                  <label class="block">
                    <span class="text-sm text-neutral-600">Location Name</span>
                    <input
                      v-model="editingEvent.location"
                      class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                      placeholder="Auraria Campus"
                    />
                  </label>

                  <div class="block">
                    <span class="text-sm text-neutral-600">Address</span>
                    <div class="mt-1">
                      <AddressAutocomplete
                        v-model="editingEvent.address"
                        placeholder="Start typing an address..."
                        @select="onAddressSelect"
                      />
                    </div>
                    <span class="text-xs text-neutral-400 mt-1">Latitude and longitude will auto-fill when you select an address</span>
                  </div>

                  <div class="block">
                    <span class="text-sm text-neutral-600">Adjust Location</span>
                    <div class="mt-1">
                      <MapPicker
                        v-model:lat="editingEvent.lat"
                        v-model:lng="editingEvent.lng"
                      />
                    </div>
                    <span class="text-xs text-neutral-400 mt-1">Click or drag the marker to set exact position</span>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <label class="block">
                      <span class="text-sm text-neutral-600">Latitude</span>
                      <input
                        v-model.number="editingEvent.lat"
                        type="number"
                        step="0.000001"
                        class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                      />
                    </label>
                    <label class="block">
                      <span class="text-sm text-neutral-600">Longitude</span>
                      <input
                        v-model.number="editingEvent.lng"
                        type="number"
                        step="0.000001"
                        class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
                      />
                    </label>
                  </div>

                  <!-- Event Pricing -->
                  <div class="border border-neutral-200 rounded-lg">
                    <button
                      @click="showEventPricing = !showEventPricing"
                      class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg"
                    >
                      <span>
                        Event Pricing
                        <span v-if="editingEvent.priceOverrides && Object.keys(editingEvent.priceOverrides).length > 0" class="ml-1 text-xs text-neutral-500">
                          ({{ Object.keys(editingEvent.priceOverrides).length }} override{{ Object.keys(editingEvent.priceOverrides).length !== 1 ? 's' : '' }})
                        </span>
                      </span>
                      <span class="text-neutral-400">{{ showEventPricing ? '▲' : '▼' }}</span>
                    </button>
                    <div v-if="showEventPricing" class="px-4 pb-4 space-y-4">
                      <p class="text-xs text-neutral-400">Set custom prices for this event. Leave blank to use the default menu price.</p>
                      <div v-for="category in menuData.categories" :key="category.id">
                        <h4 class="text-sm font-medium text-neutral-600 mb-2">{{ category.name }}</h4>
                        <div class="space-y-2">
                          <div v-for="item in category.items" :key="item.name" class="flex items-center gap-3">
                            <span class="text-sm text-neutral-700 flex-1">{{ item.name }}</span>
                            <span class="text-xs text-neutral-400 w-16 text-right">${{ item.price.toFixed(2) }}</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              :value="getOverridePrice(category.id, item.name)"
                              @input="setOverridePrice(category.id, item.name, ($event.target as HTMLInputElement).value)"
                              class="w-24 rounded border border-neutral-300 px-2 py-1 text-sm"
                              placeholder="Default"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        v-if="editingEvent.priceOverrides && Object.keys(editingEvent.priceOverrides).length > 0"
                        @click="clearAllOverrides"
                        class="text-xs text-red-600 hover:text-red-700"
                      >
                        Clear All Overrides
                      </button>
                    </div>
                  </div>
                </div>

                <div class="flex gap-3 mt-6">
                  <button
                    @click="editingEvent = null"
                    class="flex-1 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    @click="saveScheduleEvent"
                    class="flex-1 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <!-- Events List -->
            <div class="space-y-3">
              <div
                v-for="event in scheduleData"
                :key="event.id"
                class="border border-neutral-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p class="font-medium">
                    {{ event.startTime ? formatDayOfWeek(event.date) : event.day }}, {{ event.startTime ? formatDisplayDate(event.date) : event.date }}
                    <span v-if="event.private" class="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Private</span>
                  </p>
                  <p class="text-sm text-neutral-500">
                    {{ event.location }} - {{ event.startTime ? formatTimeRange(event.startTime, event.endTime) : event.time }}
                  </p>
                  <p class="text-sm text-neutral-400">{{ event.address }}</p>
                  <p v-if="event.duration" class="text-sm text-neutral-400">Duration: {{ event.duration }}</p>
                  <p v-if="event.priceOverrides && Object.keys(event.priceOverrides).length > 0" class="text-sm text-amber-600">
                    {{ Object.keys(event.priceOverrides).length }} price override{{ Object.keys(event.priceOverrides).length !== 1 ? 's' : '' }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    @click="editScheduleEvent(event)"
                    class="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Edit
                  </button>
                  <button
                    @click="removeScheduleEvent(event.id)"
                    class="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p v-if="scheduleData.length === 0" class="text-neutral-500 text-center py-8">
                No events scheduled. Click "Add Event" to create one.
              </p>
            </div>
          </div>

          <button
            @click="saveSchedule"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save Schedule' }}
          </button>
        </div>

        <!-- Bookings Manager -->
        <div v-if="activeTab === 'bookings'" class="space-y-4">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4">Booking Requests</h2>

            <div v-if="sortedBookings.length === 0" class="text-neutral-500 text-center py-8">
              No booking requests yet.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="booking in sortedBookings"
                :key="booking.id"
                class="border border-neutral-200 rounded-lg overflow-hidden"
              >
                <!-- Booking Header -->
                <div
                  @click="toggleBooking(booking.id)"
                  class="p-4 cursor-pointer hover:bg-neutral-50 flex justify-between items-center"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <span
                        :class="[
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        ]"
                      >
                        {{ booking.status }}
                      </span>
                      <span class="font-medium">{{ booking.name }}</span>
                    </div>
                    <p class="text-sm text-neutral-500 mt-1">
                      {{ booking.eventType }} - {{ booking.eventDate }} at {{ booking.location }}
                    </p>
                  </div>
                  <svg
                    :class="['w-5 h-5 text-neutral-400 transition-transform', expandedBookingId === booking.id ? 'rotate-180' : '']"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <!-- Booking Details (Expanded) -->
                <div v-if="expandedBookingId === booking.id" class="border-t border-neutral-200 p-4 bg-neutral-50">
                  <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p class="text-neutral-500">Email</p>
                      <p class="font-medium">{{ booking.email }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Phone</p>
                      <p class="font-medium">{{ booking.phone }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Event Date</p>
                      <p class="font-medium">{{ formatDayOfWeek(booking.eventDate) }}, {{ formatDisplayDate(booking.eventDate) }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Event Time</p>
                      <p class="font-medium">{{ booking.startTime ? formatTimeRange(booking.startTime, booking.endTime) : booking.eventTime }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Location</p>
                      <p class="font-medium">{{ booking.location }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Address</p>
                      <p class="font-medium">{{ booking.address }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Event Type</p>
                      <p class="font-medium">{{ booking.eventType }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Guest Count</p>
                      <p class="font-medium">{{ booking.guestCount }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Private Event</p>
                      <label class="flex items-center gap-2 mt-1">
                        <input
                          v-model="booking.private"
                          type="checkbox"
                          class="rounded border-neutral-300"
                        />
                        <span class="text-sm font-medium">{{ booking.private ? 'Yes' : 'No' }}</span>
                      </label>
                    </div>
                    <div class="col-span-2">
                      <p class="text-neutral-500">Submitted</p>
                      <p class="font-medium">{{ formatTimestamp(booking.createdAt) }}</p>
                    </div>
                  </div>

                  <div v-if="booking.message" class="mb-4">
                    <p class="text-neutral-500 text-sm">Additional Details</p>
                    <p class="text-sm bg-white p-3 rounded border border-neutral-200 mt-1">{{ booking.message }}</p>
                  </div>

                  <div class="mb-4">
                    <label class="block">
                      <span class="text-sm text-neutral-500">Admin Notes</span>
                      <textarea
                        v-model="booking.adminNotes"
                        rows="2"
                        class="mt-1 block w-full text-sm border border-neutral-300 rounded px-3 py-2 focus:border-neutral-400 focus:outline-none"
                        placeholder="Internal notes about this booking..."
                      ></textarea>
                    </label>
                  </div>

                  <div class="flex gap-2 mb-2">
                    <button
                      @click="saveBooking(booking)"
                      :disabled="loading"
                      class="flex-1 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-50 text-sm font-medium"
                    >
                      Save
                    </button>
                  </div>

                  <div class="flex gap-2">
                    <button
                      v-if="booking.status !== 'confirmed'"
                      @click="updateBookingStatus(booking, 'confirmed')"
                      :disabled="loading"
                      class="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      v-if="booking.status !== 'denied'"
                      @click="updateBookingStatus(booking, 'denied')"
                      :disabled="loading"
                      class="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Deny
                    </button>
                    <button
                      v-if="booking.status !== 'pending'"
                      @click="updateBookingStatus(booking, 'pending')"
                      :disabled="loading"
                      class="flex-1 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Reset to Pending
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Orders Manager -->
        <div v-if="activeTab === 'orders'" class="space-y-4">
          <!-- Online Ordering Toggle -->
          <div class="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">Online Ordering</h2>
              <p class="text-sm text-neutral-500 mt-1">
                {{ settingsData.onlineOrderingEnabled ? 'Customers can place orders from the menu' : 'Ordering is hidden from customers' }}
              </p>
            </div>
            <button
              @click="toggleOnlineOrdering"
              :disabled="loading"
              :class="[
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                settingsData.onlineOrderingEnabled ? 'bg-green-500' : 'bg-neutral-300'
              ]"
            >
              <span
                :class="[
                  'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  settingsData.onlineOrderingEnabled ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4">Orders</h2>

            <!-- Status Filter -->
            <div class="flex flex-wrap gap-2 mb-6">
              <button
                v-for="filter in (['all', 'paid', 'fulfilled', 'cancelled', 'pending'] as const)"
                :key="filter"
                @click="ordersFilter = filter"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-full border transition-all',
                  ordersFilter === filter
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                ]"
              >
                {{ filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1) }}
              </button>
            </div>

            <div v-if="filteredOrders.length === 0" class="text-neutral-500 text-center py-8">
              No orders found.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="order in filteredOrders"
                :key="order.id"
                class="border border-neutral-200 rounded-lg overflow-hidden"
              >
                <!-- Order Header -->
                <div
                  @click="toggleOrder(order.id)"
                  class="p-4 cursor-pointer hover:bg-neutral-50 flex justify-between items-center"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <span
                        :class="[
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'paid' ? 'bg-green-100 text-green-800' :
                          order.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        ]"
                      >
                        {{ order.status }}
                      </span>
                      <span class="font-medium">{{ order.customerName || 'Guest' }}</span>
                      <span class="text-sm text-neutral-500">${{ order.total.toFixed(2) }}</span>
                    </div>
                    <p class="text-sm text-neutral-500 mt-1">
                      {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }} &middot; {{ formatTimestamp(order.createdAt) }}
                    </p>
                  </div>
                  <svg
                    :class="['w-5 h-5 text-neutral-400 transition-transform', expandedOrderId === order.id ? 'rotate-180' : '']"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <!-- Order Details (Expanded) -->
                <div v-if="expandedOrderId === order.id" class="border-t border-neutral-200 p-4 bg-neutral-50">
                  <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p class="text-neutral-500">Customer</p>
                      <p class="font-medium">{{ order.customerName || 'N/A' }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Email</p>
                      <p class="font-medium">{{ order.customerEmail || 'N/A' }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Order ID</p>
                      <p class="font-medium text-xs font-mono">{{ order.id }}</p>
                    </div>
                    <div>
                      <p class="text-neutral-500">Placed</p>
                      <p class="font-medium">{{ formatTimestamp(order.createdAt) }}</p>
                    </div>
                  </div>

                  <!-- Line Items -->
                  <div class="mb-4">
                    <p class="text-neutral-500 text-sm mb-2">Items</p>
                    <div class="bg-white border border-neutral-200 rounded divide-y divide-neutral-100">
                      <div
                        v-for="item in order.items"
                        :key="`${item.categoryId}:${item.itemName}`"
                        class="flex justify-between px-3 py-2 text-sm"
                      >
                        <span>{{ item.itemName }} <span class="text-neutral-400">x{{ item.quantity }}</span></span>
                        <span class="font-medium">${{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
                      </div>
                      <div class="flex justify-between px-3 py-2 text-sm font-semibold">
                        <span>Total</span>
                        <span>${{ order.total.toFixed(2) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Admin Notes -->
                  <div class="mb-4">
                    <label class="block">
                      <span class="text-sm text-neutral-500">Admin Notes</span>
                      <textarea
                        v-model="order.adminNotes"
                        rows="2"
                        class="mt-1 block w-full text-sm border border-neutral-300 rounded px-3 py-2 focus:border-neutral-400 focus:outline-none"
                        placeholder="Internal notes about this order..."
                      ></textarea>
                    </label>
                  </div>

                  <div class="flex gap-2 mb-2">
                    <button
                      @click="saveOrderNotes(order)"
                      :disabled="loading"
                      class="flex-1 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-50 text-sm font-medium"
                    >
                      Save Notes
                    </button>
                  </div>

                  <!-- Status Actions -->
                  <div class="flex gap-2">
                    <button
                      v-if="order.status === 'paid'"
                      @click="updateOrderStatus(order, 'fulfilled')"
                      :disabled="loading"
                      class="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Mark Fulfilled
                    </button>
                    <button
                      v-if="order.status !== 'cancelled' && order.status !== 'pending'"
                      @click="updateOrderStatus(order, 'cancelled')"
                      :disabled="loading"
                      class="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Cancel Order
                    </button>
                    <button
                      v-if="order.status === 'fulfilled' || order.status === 'cancelled'"
                      @click="updateOrderStatus(order, 'paid')"
                      :disabled="loading"
                      class="flex-1 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Revert to Paid
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hero Editor -->
        <div v-if="activeTab === 'hero'" class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4">Hero Section</h2>
            <p class="text-sm text-neutral-500 mb-6">Edit the hero banner content that appears at the top of the homepage.</p>

            <div class="space-y-4">
              <!-- Hero Background Image -->
              <div>
                <span class="text-sm text-neutral-600 block mb-2">Background Image</span>
                <div class="flex items-start gap-4">
                  <div
                    class="relative w-48 h-28 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100"
                    :style="heroData.imageKey ? {
                      backgroundImage: `url(/api/images/${heroData.imageKey})`,
                      backgroundPosition: heroData.imagePosition || 'center',
                      backgroundSize: (heroData.imageScale || 1) === 1 ? 'cover' : `${(heroData.imageScale || 1) * 100}%`,
                      backgroundRepeat: 'no-repeat'
                    } : {
                      backgroundImage: 'url(/hero.jpg)',
                      backgroundPosition: 'center',
                      backgroundSize: 'cover'
                    }"
                  >
                    <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span class="text-white text-xs font-medium">{{ heroData.imageKey ? 'Custom Image' : 'Default Image' }}</span>
                    </div>
                    <button
                      v-if="heroData.imageKey"
                      @click="removeHeroImage"
                      class="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-700"
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="cursor-pointer">
                      <span
                        :class="[
                          'inline-block text-sm px-3 py-1.5 rounded border',
                          uploadingHeroImage
                            ? 'bg-neutral-100 text-neutral-400 border-neutral-200'
                            : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                        ]"
                      >
                        {{ uploadingHeroImage ? 'Uploading...' : (heroData.imageKey ? 'Change Image' : 'Upload Image') }}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        class="hidden"
                        :disabled="uploadingHeroImage"
                        @change="uploadHeroImage"
                      />
                    </label>
                    <button
                      v-if="heroData.imageKey"
                      @click="showHeroPreview"
                      class="text-sm text-neutral-600 border border-neutral-300 px-3 py-1.5 rounded hover:bg-neutral-50"
                    >
                      Adjust Position
                    </button>
                    <span class="text-xs text-neutral-400">JPEG, PNG, or WebP (max 5MB)</span>
                  </div>
                </div>
              </div>

              <label class="block">
                <span class="text-sm text-neutral-600">Title</span>
                <input
                  v-model="heroData.title"
                  class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none"
                  placeholder="YoYo Bubble Tea"
                />
                <span class="text-xs text-neutral-400 mt-1">Appears in the navigation bar and hero banner</span>
              </label>

              <label class="block">
                <span class="text-sm text-neutral-600">Tagline</span>
                <textarea
                  v-model="heroData.tagline"
                  rows="2"
                  class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none"
                  placeholder="Everything's yummy at YoYo! Refreshing boba, bubble waffles & more."
                ></textarea>
              </label>

              <div class="grid grid-cols-2 gap-4">
                <label class="block">
                  <span class="text-sm text-neutral-600">Button Text</span>
                  <input
                    v-model="heroData.ctaText"
                    class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none"
                    placeholder="Find Us Today"
                  />
                </label>
                <label class="block">
                  <span class="text-sm text-neutral-600">Button Link</span>
                  <input
                    v-model="heroData.ctaLink"
                    class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none"
                    placeholder="#schedule"
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            @click="saveHero"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save Hero' }}
          </button>
        </div>

        <!-- About Editor -->
        <div v-if="activeTab === 'about'" class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4">About Section</h2>
            <p class="text-sm text-neutral-500 mb-6">Edit the "Our Story" section content.</p>

            <div class="space-y-4">
              <label class="block">
                <span class="text-sm text-neutral-600">Heading</span>
                <input
                  v-model="aboutData.heading"
                  class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none"
                  placeholder="Our Story"
                />
              </label>

              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-neutral-600">Paragraphs</span>
                  <button
                    @click="addParagraph"
                    class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800"
                  >
                    Add Paragraph
                  </button>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(_paragraph, index) in aboutData.paragraphs"
                    :key="index"
                    class="border border-neutral-200 rounded-lg p-3"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <span class="text-xs text-neutral-400">Paragraph {{ index + 1 }}</span>
                      <button
                        @click="removeParagraph(index)"
                        class="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      v-model="aboutData.paragraphs[index]"
                      rows="3"
                      class="w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none text-sm"
                      placeholder="Enter paragraph text..."
                    ></textarea>
                  </div>

                  <p v-if="aboutData.paragraphs.length === 0" class="text-neutral-500 text-center py-4 text-sm">
                    No paragraphs yet. Click "Add Paragraph" to create one.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="saveAbout"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save About' }}
          </button>
        </div>

        <!-- Social Links Editor -->
        <div v-if="activeTab === 'social'" class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4">Social Links</h2>
            <p class="text-sm text-neutral-500 mb-6">Manage the social media links displayed in the site footer.</p>

            <div class="space-y-4">
              <div
                v-for="(link, index) in socialLinksData.links"
                :key="index"
                class="border border-neutral-200 rounded-lg p-4"
              >
                <div class="flex items-center gap-3">
                  <select
                    v-model="link.platform"
                    class="rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none text-sm"
                  >
                    <option v-for="p in socialPlatforms" :key="p.slug" :value="p.slug">
                      {{ p.label }}
                    </option>
                  </select>
                  <input
                    v-model="link.url"
                    type="url"
                    class="flex-1 rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none text-sm"
                    placeholder="https://..."
                  />
                  <button
                    @click="removeSocialLink(index)"
                    class="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div class="flex items-center gap-4 mt-2 ml-1">
                  <label class="flex items-center gap-1.5 text-sm text-neutral-600">
                    <input type="checkbox" v-model="link.showInHeader" class="rounded border-neutral-300" />
                    Header
                  </label>
                  <label class="flex items-center gap-1.5 text-sm text-neutral-600">
                    <input type="checkbox" v-model="link.showInFooter" class="rounded border-neutral-300" />
                    Footer
                  </label>
                </div>
              </div>

              <p v-if="socialLinksData.links.length === 0" class="text-neutral-500 text-center py-4 text-sm">
                No social links configured. Click "Add Link" to create one.
              </p>
            </div>

            <div class="mt-4">
              <button
                @click="addSocialLink"
                class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800"
              >
                Add Link
              </button>
            </div>
          </div>

          <button
            @click="saveSocialLinks"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save Social Links' }}
          </button>
        </div>

        <!-- Favicon Editor -->
        <div v-if="activeTab === 'favicon'" class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4">Favicon</h2>
            <p class="text-sm text-neutral-500 mb-6">Upload a source image (minimum 512x512, square preferred) to generate all favicon variants for browsers, iOS, and Android.</p>

            <!-- Current Status -->
            <div class="mb-6 p-4 rounded-lg" :class="faviconData.hasCustomFavicon ? 'bg-green-50 border border-green-200' : 'bg-neutral-50 border border-neutral-200'">
              <p class="text-sm font-medium" :class="faviconData.hasCustomFavicon ? 'text-green-800' : 'text-neutral-600'">
                {{ faviconData.hasCustomFavicon ? 'Custom favicon is active' : 'No custom favicon set (using browser defaults)' }}
              </p>
            </div>

            <!-- Preview Grid -->
            <div v-if="faviconData.hasCustomFavicon" class="mb-6">
              <span class="text-sm text-neutral-600 block mb-3">Current Variants</span>
              <div class="grid grid-cols-3 gap-4">
                <div class="text-center">
                  <div class="inline-block border border-neutral-200 rounded p-2 bg-white">
                    <img :src="'/api/images/favicon/favicon-16x16.png'" alt="16x16" class="block" style="width: 16px; height: 16px; image-rendering: pixelated;" />
                  </div>
                  <p class="text-xs text-neutral-400 mt-1">16x16</p>
                </div>
                <div class="text-center">
                  <div class="inline-block border border-neutral-200 rounded p-2 bg-white">
                    <img :src="'/api/images/favicon/favicon-32x32.png'" alt="32x32" class="block" style="width: 32px; height: 32px;" />
                  </div>
                  <p class="text-xs text-neutral-400 mt-1">32x32</p>
                </div>
                <div class="text-center">
                  <div class="inline-block border border-neutral-200 rounded p-2 bg-white">
                    <img :src="'/api/images/favicon/apple-touch-icon.png'" alt="180x180" class="block" style="width: 60px; height: 60px;" />
                  </div>
                  <p class="text-xs text-neutral-400 mt-1">180x180 (iOS)</p>
                </div>
                <div class="text-center">
                  <div class="inline-block border border-neutral-200 rounded p-2 bg-white">
                    <img :src="`/api/images/favicon/android-chrome-192x192.png`" alt="192x192" class="block" style="width: 64px; height: 64px;" />
                  </div>
                  <p class="text-xs text-neutral-400 mt-1">192x192 (Android)</p>
                </div>
                <div class="text-center">
                  <div class="inline-block border border-neutral-200 rounded p-2 bg-white">
                    <img :src="`/api/images/favicon/android-chrome-512x512.png`" alt="512x512" class="block" style="width: 80px; height: 80px;" />
                  </div>
                  <p class="text-xs text-neutral-400 mt-1">512x512 (PWA)</p>
                </div>
              </div>
            </div>

            <!-- Upload -->
            <div class="mb-6">
              <span class="text-sm text-neutral-600 block mb-2">{{ faviconData.hasCustomFavicon ? 'Replace Favicon' : 'Upload Source Image' }}</span>
              <div class="flex items-center gap-3">
                <label class="cursor-pointer">
                  <span
                    :class="[
                      'inline-block text-sm px-3 py-1.5 rounded border',
                      uploadingFavicon
                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200'
                        : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
                    ]"
                  >
                    {{ uploadingFavicon ? 'Generating variants...' : 'Choose Image' }}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    class="hidden"
                    :disabled="uploadingFavicon"
                    @change="uploadFavicon"
                  />
                </label>
                <span class="text-xs text-neutral-400">JPEG, PNG, or WebP. Min 512x512, square preferred.</span>
              </div>
            </div>

            <!-- Remove Button -->
            <div v-if="faviconData.hasCustomFavicon" class="mb-6">
              <button
                @click="removeFavicon"
                :disabled="loading"
                class="text-sm bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Remove Custom Favicon
              </button>
            </div>

            <!-- Settings -->
            <div class="border-t border-neutral-200 pt-6 space-y-4">
              <h3 class="font-medium">Web Manifest Settings</h3>
              <p class="text-sm text-neutral-500">These settings are used in the web app manifest for Android/PWA.</p>

              <label class="block">
                <span class="text-sm text-neutral-600">Site Name</span>
                <input
                  v-model="faviconData.siteName"
                  class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none"
                  placeholder="My Food Truck"
                />
              </label>

              <label class="block">
                <span class="text-sm text-neutral-600">Theme Color</span>
                <div class="flex items-center gap-3 mt-1">
                  <input
                    v-model="faviconData.themeColor"
                    type="color"
                    class="w-10 h-10 rounded border border-neutral-300 cursor-pointer"
                  />
                  <input
                    v-model="faviconData.themeColor"
                    type="text"
                    class="flex-1 rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none font-mono text-sm"
                    placeholder="#ffffff"
                  />
                </div>
              </label>
            </div>

            <!-- SEO Settings -->
            <div class="border-t border-neutral-200 pt-6 space-y-4">
              <h3 class="font-medium">SEO Settings</h3>
              <p class="text-sm text-neutral-500">Set a meta description to improve how your site appears in search engine results.</p>

              <label class="block">
                <span class="text-sm text-neutral-600">Meta Description</span>
                <textarea
                  v-model="faviconData.metaDescription"
                  rows="3"
                  maxlength="160"
                  class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none text-sm"
                  placeholder="A short description of your food truck for search engines (max 160 characters)"
                ></textarea>
                <span class="text-xs text-neutral-400 mt-1 block">{{ faviconData.metaDescription?.length || 0 }}/160 characters</span>
              </label>
            </div>
          </div>

          <button
            @click="saveFavicon"
            :disabled="loading"
            class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save Favicon Settings' }}
          </button>
        </div>

        <!-- Backup & Restore -->
        <div v-if="activeTab === 'backup'" class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4">Backup & Restore</h2>
            <p class="text-sm text-neutral-500 mb-6">Download a complete backup of your site content and images, or restore from a previous backup.</p>

            <!-- Progress indicator -->
            <div v-if="backupProgress" class="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg">
              <div class="flex items-center gap-3">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ backupProgress }}</span>
              </div>
            </div>

            <!-- Backup Section -->
            <div class="border-b border-neutral-200 pb-6 mb-6">
              <h3 class="font-medium mb-2">Download Backup</h3>
              <p class="text-sm text-neutral-500 mb-4">
                Creates a ZIP file containing all your content (menu, schedule, bookings, hero, about) and images.
              </p>
              <button
                @click="createBackup"
                :disabled="backupLoading"
                class="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
              >
                {{ backupLoading ? 'Creating Backup...' : 'Download Backup' }}
              </button>
            </div>

            <!-- Restore Section -->
            <div>
              <h3 class="font-medium mb-2">Restore from Backup</h3>
              <p class="text-sm text-neutral-500 mb-4">
                Upload a previously downloaded backup ZIP file to restore your site.
                <span class="text-red-600 font-medium">Warning: This will overwrite all existing content and images.</span>
              </p>

              <div class="space-y-4">
                <label class="block">
                  <span class="text-sm text-neutral-600">Select Backup File</span>
                  <input
                    type="file"
                    accept=".zip"
                    @change="onRestoreFileSelect"
                    class="mt-1 block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200"
                  />
                </label>

                <button
                  v-if="restoreFile"
                  @click="restoreBackup"
                  :disabled="backupLoading"
                  class="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {{ backupLoading ? 'Restoring...' : 'Restore Backup' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Image Preview Modal -->
    <div v-if="previewItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-neutral-50 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Menu Item Preview</h3>

        <!-- Exact replica of TabbedMenuSection card -->
        <div class="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
          <div
            v-if="previewImageUrl"
            class="h-40 bg-neutral-100"
            :style="{
              backgroundImage: `url(${previewImageUrl})`,
              backgroundPosition: previewPosition,
              backgroundSize: `${previewScale * 100}%`,
              backgroundRepeat: 'no-repeat'
            }"
          />
          <div class="p-5">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-display text-lg font-semibold text-neutral-900">{{ previewItem.name }}</h3>
              <span class="font-display text-lg font-semibold text-neutral-900">${{ previewItem.price.toFixed(2) }}</span>
            </div>
            <p v-if="previewItem.description" class="font-body text-sm text-neutral-500 leading-relaxed">
              {{ previewItem.description }}
            </p>
          </div>
        </div>

        <!-- Position Selector -->
        <div v-if="previewImageUrl" class="mt-4">
          <p class="text-sm text-neutral-600 mb-2">Image focal point:</p>
          <div class="grid grid-cols-3 gap-1 w-32 mx-auto">
            <button
              v-for="pos in ['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right']"
              :key="pos"
              @click="previewPosition = pos"
              :class="[
                'w-10 h-10 rounded text-xs border',
                previewPosition === pos
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-100'
              ]"
              :title="pos"
            >
              {{ pos === 'top left' ? 'TL' : pos === 'top' ? 'T' : pos === 'top right' ? 'TR' : pos === 'left' ? 'L' : pos === 'center' ? 'C' : pos === 'right' ? 'R' : pos === 'bottom left' ? 'BL' : pos === 'bottom' ? 'B' : 'BR' }}
            </button>
          </div>

          <!-- Scale/Zoom Slider -->
          <div class="mt-4">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-neutral-600">Zoom:</span>
              <span class="text-sm text-neutral-500">{{ previewScale < 1 ? `-${Math.round((1 - previewScale) * 100)}%` : previewScale > 1 ? `+${Math.round((previewScale - 1) * 100)}%` : '0%' }}</span>
            </div>
            <input
              v-model.number="previewScale"
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              class="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
            />
            <div class="flex justify-between text-xs text-neutral-400 mt-1">
              <span>Zoom out</span>
              <span>1x</span>
              <span>Zoom in</span>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-4">
          <button
            @click="closePreview"
            class="flex-1 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            @click="applyPosition"
            class="flex-1 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
          >
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Hero Image Preview Modal -->
    <div v-if="heroPreviewOpen && heroData.imageKey" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-neutral-50 rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Hero Image Preview</h3>

        <!-- Hero preview -->
        <div class="relative rounded-lg overflow-hidden">
          <div
            class="h-48 bg-neutral-100"
            :style="{
              backgroundImage: `url(/api/images/${heroData.imageKey})`,
              backgroundPosition: heroPreviewPosition,
              backgroundSize: heroPreviewScale === 1 ? 'cover' : `${heroPreviewScale * 100}%`,
              backgroundRepeat: 'no-repeat'
            }"
          />
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div class="text-center text-white">
              <h2 class="text-2xl font-bold mb-2">{{ heroData.title || 'Your Title' }}</h2>
              <p class="text-sm opacity-80">{{ heroData.tagline || 'Your tagline here' }}</p>
            </div>
          </div>
        </div>

        <!-- Position Selector -->
        <div class="mt-4">
          <p class="text-sm text-neutral-600 mb-2">Image focal point:</p>
          <div class="grid grid-cols-3 gap-1 w-32 mx-auto">
            <button
              v-for="pos in ['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right']"
              :key="pos"
              @click="heroPreviewPosition = pos"
              :class="[
                'w-10 h-10 rounded text-xs border',
                heroPreviewPosition === pos
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-100'
              ]"
              :title="pos"
            >
              {{ pos === 'top left' ? 'TL' : pos === 'top' ? 'T' : pos === 'top right' ? 'TR' : pos === 'left' ? 'L' : pos === 'center' ? 'C' : pos === 'right' ? 'R' : pos === 'bottom left' ? 'BL' : pos === 'bottom' ? 'B' : 'BR' }}
            </button>
          </div>

          <!-- Scale/Zoom Slider -->
          <div class="mt-4">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-neutral-600">Zoom:</span>
              <span class="text-sm text-neutral-500">{{ heroPreviewScale < 1 ? `-${Math.round((1 - heroPreviewScale) * 100)}%` : heroPreviewScale > 1 ? `+${Math.round((heroPreviewScale - 1) * 100)}%` : '0%' }}</span>
            </div>
            <input
              v-model.number="heroPreviewScale"
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              class="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
            />
            <div class="flex justify-between text-xs text-neutral-400 mt-1">
              <span>Zoom out</span>
              <span>1x</span>
              <span>Zoom in</span>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-4">
          <button
            @click="closeHeroPreview"
            class="flex-1 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            @click="applyHeroPosition"
            class="flex-1 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
