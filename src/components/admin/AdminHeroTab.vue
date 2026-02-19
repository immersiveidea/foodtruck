<script setup lang="ts">
import { ref } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
import { useAdminData } from '../../composables/useAdminData'
import { validateAndUploadImage } from '../../composables/useAdminImageUpload'
import AdminImagePreview from './AdminImagePreview.vue'

const { loading, message, adminSave, deleteImageFromR2 } = useAdminApi()
const { heroData } = useAdminData()

const uploadingHeroImage = ref(false)
const heroPreviewOpen = ref(false)

async function saveHero() {
  await adminSave('/api/admin/hero', heroData.value, 'Hero content saved successfully')
}

async function uploadHeroImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingHeroImage.value = true
  message.value = null
  try {
    const result = await validateAndUploadImage(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, initialQuality: 0.85 })
    if ('error' in result) {
      message.value = { type: 'error', text: result.error }
    } else {
      if (heroData.value.imageKey) await deleteImageFromR2(heroData.value.imageKey)
      heroData.value.imageKey = result.key
      message.value = { type: 'success', text: 'Hero image uploaded. Click "Save Hero" to persist.' }
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

function applyHeroPosition(position: string, scale: number) {
  heroData.value.imagePosition = position
  heroData.value.imageScale = scale
  message.value = { type: 'success', text: 'Image settings updated. Click "Save Hero" to persist.' }
  heroPreviewOpen.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold mb-4">Hero Section</h2>
      <p class="text-sm text-neutral-500 mb-6">Edit the hero banner content that appears at the top of the homepage.</p>

      <div class="space-y-4">
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
              } : { backgroundImage: 'url(/hero.jpg)', backgroundPosition: 'center', backgroundSize: 'cover' }"
            >
              <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span class="text-white text-xs font-medium">{{ heroData.imageKey ? 'Custom Image' : 'Default Image' }}</span>
              </div>
              <button v-if="heroData.imageKey" @click="removeHeroImage" class="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-700" title="Remove image">&times;</button>
            </div>
            <div class="flex flex-col gap-2">
              <label class="cursor-pointer">
                <span :class="['inline-block text-sm px-3 py-1.5 rounded border', uploadingHeroImage ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50']">
                  {{ uploadingHeroImage ? 'Uploading...' : (heroData.imageKey ? 'Change Image' : 'Upload Image') }}
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" :disabled="uploadingHeroImage" @change="uploadHeroImage" />
              </label>
              <button v-if="heroData.imageKey" @click="heroPreviewOpen = true" class="text-sm text-neutral-600 border border-neutral-300 px-3 py-1.5 rounded hover:bg-neutral-50">Adjust Position</button>
              <span class="text-xs text-neutral-400">JPEG, PNG, or WebP (max 5MB)</span>
            </div>
          </div>
        </div>

        <label class="block">
          <span class="text-sm text-neutral-600">Title</span>
          <input v-model="heroData.title" class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none" placeholder="YoYo Bubble Tea" />
          <span class="text-xs text-neutral-400 mt-1">Appears in the navigation bar and hero banner</span>
        </label>
        <label class="block">
          <span class="text-sm text-neutral-600">Tagline</span>
          <textarea v-model="heroData.tagline" rows="2" class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none" placeholder="Everything's yummy at YoYo! Refreshing boba, bubble waffles & more."></textarea>
        </label>
        <div class="grid grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm text-neutral-600">Button Text</span>
            <input v-model="heroData.ctaText" class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none" placeholder="Find Us Today" />
          </label>
          <label class="block">
            <span class="text-sm text-neutral-600">Button Link</span>
            <input v-model="heroData.ctaLink" class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none" placeholder="#schedule" />
          </label>
        </div>
      </div>
    </div>

    <button @click="saveHero" :disabled="loading" class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50">
      {{ loading ? 'Saving...' : 'Save Hero' }}
    </button>

    <AdminImagePreview
      :open="heroPreviewOpen"
      title="Hero Image Preview"
      :image-url="heroData.imageKey ? `/api/images/${heroData.imageKey}` : ''"
      :initial-position="heroData.imagePosition || 'center'"
      :initial-scale="heroData.imageScale || 1"
      @close="heroPreviewOpen = false"
      @apply="applyHeroPosition"
    >
      <template #default="{ position, scale }">
        <div class="relative rounded-lg overflow-hidden">
          <div class="h-48 bg-neutral-100" :style="{ backgroundImage: `url(/api/images/${heroData.imageKey})`, backgroundPosition: position, backgroundSize: scale === 1 ? 'cover' : `${scale * 100}%`, backgroundRepeat: 'no-repeat' }" />
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div class="text-center text-white">
              <h2 class="text-2xl font-bold mb-2">{{ heroData.title || 'Your Title' }}</h2>
              <p class="text-sm opacity-80">{{ heroData.tagline || 'Your tagline here' }}</p>
            </div>
          </div>
        </div>
      </template>
    </AdminImagePreview>
  </div>
</template>
