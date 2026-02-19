import { ref } from 'vue'
import { validateSourceImage, validateImageDimensions, generateFaviconVariants } from '../lib/favicon/generator'
import type { FaviconVariant } from '../lib/favicon/generator'
import { useAdminApi } from './useAdminApi'
import { useAdminData } from './useAdminData'
import { useLogger } from './useLogger'

const logger = useLogger('AdminFavicon')
const uploadingFavicon = ref(false)
const faviconPreviewVariants = ref<FaviconVariant[]>([])

async function uploadFavicon(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const { adminFetch, message, adminSave } = useAdminApi()
  const { faviconData } = useAdminData()

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

    const variants = await generateFaviconVariants(file)
    faviconPreviewVariants.value = variants

    for (const variant of variants) {
      const formData = new FormData()
      formData.append('file', variant.blob, variant.key.split('/').pop() || 'favicon.png')
      formData.append('key', variant.key)
      const res = await adminFetch('/api/admin/restore-image', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Failed to upload ${variant.key}`)
    }

    faviconData.value.hasCustomFavicon = true
    await adminSave('/api/admin/favicon', faviconData.value, 'Favicon settings saved successfully')
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
  const { adminFetch, loading, message } = useAdminApi()
  const { faviconData } = useAdminData()

  loading.value = true
  message.value = null
  try {
    const res = await adminFetch('/api/admin/favicon', { method: 'DELETE' })
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

export function useAdminFavicon() {
  return { uploadingFavicon, faviconPreviewVariants, uploadFavicon, removeFavicon }
}
