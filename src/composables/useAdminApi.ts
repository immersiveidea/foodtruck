import { ref } from 'vue'

const adminKey = ref(localStorage.getItem('adminKey') || '')
const isAuthenticated = ref(false)
const loading = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

async function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'X-Admin-Key': adminKey.value,
    },
  })
}

async function adminSave(url: string, data: unknown, successMsg: string): Promise<boolean> {
  loading.value = true
  message.value = null
  try {
    const res = await adminFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      message.value = { type: 'success', text: successMsg }
      return true
    } else {
      message.value = { type: 'error', text: `Failed: ${successMsg.toLowerCase()}` }
      return false
    }
  } catch {
    message.value = { type: 'error', text: `Failed: ${successMsg.toLowerCase()}` }
    return false
  } finally {
    loading.value = false
  }
}

async function deleteImageFromR2(key: string) {
  try {
    await adminFetch(`/api/admin/images?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
  } catch {
    // silently fail — caller handles user messaging
  }
}

function logout() {
  isAuthenticated.value = false
  adminKey.value = ''
  localStorage.removeItem('adminKey')
}

export function useAdminApi() {
  return {
    adminKey,
    isAuthenticated,
    loading,
    message,
    adminFetch,
    adminSave,
    deleteImageFromR2,
    logout,
  }
}
