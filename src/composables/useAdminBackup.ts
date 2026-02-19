import { ref } from 'vue'
import JSZip from 'jszip'
import { useAdminApi } from './useAdminApi'
import { useLogger } from './useLogger'

const logger = useLogger('AdminBackup')

const backupLoading = ref(false)
const backupProgress = ref('')
const restoreFile = ref<File | null>(null)

async function createBackup() {
  const { adminFetch, message } = useAdminApi()
  backupLoading.value = true
  backupProgress.value = 'Fetching content...'
  message.value = null

  try {
    const res = await adminFetch('/api/admin/backup')
    if (!res.ok) throw new Error('Failed to fetch backup data')

    const backupData = await res.json()
    const zip = new JSZip()
    zip.file('content.json', JSON.stringify(backupData.content, null, 2))

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

    backupProgress.value = 'Creating zip file...'
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    const date = new Date().toISOString().split('T')[0]
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `foodtruck-backup-${date}.zip`
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

async function restoreBackup(): Promise<boolean> {
  if (!restoreFile.value) return false

  const { adminFetch, message } = useAdminApi()
  backupLoading.value = true
  backupProgress.value = 'Reading backup file...'
  message.value = null

  try {
    const zip = await JSZip.loadAsync(restoreFile.value)
    const contentFile = zip.file('content.json')
    if (!contentFile) throw new Error('Invalid backup: content.json not found')

    const contentJson = await contentFile.async('string')
    const content = JSON.parse(contentJson)

    backupProgress.value = 'Restoring content...'
    const contentRes = await adminFetch('/api/admin/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, clearExistingImages: true }),
    })
    if (!contentRes.ok) throw new Error('Failed to restore content')

    const imagesFolder = zip.folder('images')
    if (imagesFolder) {
      const imageFiles: { key: string; file: JSZip.JSZipObject }[] = []
      imagesFolder.forEach((relativePath, file) => {
        if (!file.dir) imageFiles.push({ key: relativePath, file })
      })

      for (let i = 0; i < imageFiles.length; i++) {
        const { key, file } = imageFiles[i]!
        backupProgress.value = `Restoring image ${i + 1}/${imageFiles.length}...`
        try {
          const blob = await file.async('blob')
          const formData = new FormData()
          formData.append('file', blob, key.split('/').pop() || 'image')
          formData.append('key', key)
          await adminFetch('/api/admin/restore-image', { method: 'POST', body: formData })
        } catch (imgErr) {
          logger.warn('Failed to restore image', { key, error: imgErr instanceof Error ? imgErr.message : String(imgErr) })
        }
      }
    }

    message.value = { type: 'success', text: 'Backup restored successfully' }
    restoreFile.value = null
    return true
  } catch (error) {
    logger.error('Restore failed', { error: error instanceof Error ? error.message : String(error) })
    message.value = { type: 'error', text: `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}` }
    return false
  } finally {
    backupLoading.value = false
    backupProgress.value = ''
  }
}

export function useAdminBackup() {
  return { backupLoading, backupProgress, restoreFile, createBackup, restoreBackup }
}
