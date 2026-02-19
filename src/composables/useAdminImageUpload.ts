import imageCompression from 'browser-image-compression'
import { useAdminApi } from './useAdminApi'

interface UploadOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  initialQuality?: number
}

export async function validateAndUploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<{ key: string } | { error: string }> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File too large. Maximum size is 5MB.' }
  }

  const { adminFetch } = useAdminApi()

  const compressed = await imageCompression(file, {
    maxSizeMB: options.maxSizeMB ?? 0.5,
    maxWidthOrHeight: options.maxWidthOrHeight ?? 800,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: options.initialQuality ?? 0.8,
  })

  const formData = new FormData()
  formData.append('file', compressed)

  const res = await adminFetch('/api/admin/images', {
    method: 'POST',
    body: formData,
  })

  if (res.ok) {
    return (await res.json()) as { key: string }
  }
  const errData = await res.json() as { error: string }
  return { error: errData.error || 'Failed to upload image' }
}
