<script setup lang="ts">
import { ref } from 'vue'
import type { MenuItem } from '../../types'
import { useAdminApi } from '../../composables/useAdminApi'
import { validateAndUploadImage } from '../../composables/useAdminImageUpload'
import AdminImagePreview from './AdminImagePreview.vue'

const props = defineProps<{
  item: MenuItem
  index: number
}>()

const emit = defineEmits<{
  remove: [index: number]
}>()

const { message, deleteImageFromR2 } = useAdminApi()
const uploading = ref(false)
const previewOpen = ref(false)

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  message.value = null
  try {
    const result = await validateAndUploadImage(file)
    if ('error' in result) {
      message.value = { type: 'error', text: result.error }
    } else {
      if (props.item.imageKey) await deleteImageFromR2(props.item.imageKey)
      props.item.imageKey = result.key
      message.value = { type: 'success', text: 'Image uploaded. Click "Save Menu" to persist.' }
    }
  } catch {
    message.value = { type: 'error', text: 'Failed to upload image' }
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function removeImage() {
  if (!props.item.imageKey) return
  try {
    await deleteImageFromR2(props.item.imageKey)
    props.item.imageKey = undefined
    message.value = { type: 'success', text: 'Image removed. Click "Save Menu" to persist.' }
  } catch {
    message.value = { type: 'error', text: 'Failed to remove image' }
  }
}

function applyPosition(position: string, scale: number) {
  props.item.imagePosition = position
  props.item.imageScale = scale
  message.value = { type: 'success', text: 'Image settings updated. Click "Save Menu" to persist.' }
  previewOpen.value = false
}
</script>

<template>
  <div class="border border-neutral-200 rounded-lg p-4">
    <div class="flex justify-between items-start mb-2">
      <input v-model="item.name" class="font-medium border-b border-transparent focus:border-neutral-300 focus:outline-none flex-1" placeholder="Item name" />
      <div class="flex items-center gap-2 ml-4">
        <span class="text-neutral-500">$</span>
        <input v-model.number="item.price" type="number" step="0.01" min="0" class="w-20 font-medium border border-neutral-200 rounded px-2 py-1 focus:border-neutral-400 focus:outline-none" placeholder="0.00" />
        <button @click="emit('remove', index)" class="text-red-600 hover:text-red-700 text-sm ml-2">Remove</button>
      </div>
    </div>
    <textarea v-model="item.description" rows="2" class="w-full text-sm text-neutral-600 border border-neutral-200 rounded px-2 py-1 focus:border-neutral-400 focus:outline-none mb-3" placeholder="Item description (optional)"></textarea>

    <div class="flex items-center gap-3">
      <div v-if="item.imageKey" class="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-200">
        <img :src="`/api/images/${item.imageKey}`" :alt="item.name" class="w-full h-full object-cover" />
        <button @click="removeImage" class="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-700" title="Remove image">&times;</button>
      </div>
      <label class="cursor-pointer">
        <span :class="['inline-block text-sm px-3 py-1 rounded border', uploading ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50']">
          {{ uploading ? 'Uploading...' : (item.imageKey ? 'Change Image' : 'Add Image') }}
        </span>
        <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" :disabled="uploading" @change="uploadImage" />
      </label>
      <button v-if="item.imageKey" @click="previewOpen = true" class="text-sm text-neutral-600 border border-neutral-300 px-3 py-1 rounded hover:bg-neutral-50">Preview</button>
      <span class="text-xs text-neutral-400">JPEG, PNG, or WebP (max 5MB)</span>
    </div>

    <AdminImagePreview
      :open="previewOpen"
      title="Menu Item Preview"
      :image-url="item.imageKey ? `/api/images/${item.imageKey}` : ''"
      :initial-position="item.imagePosition || 'center'"
      :initial-scale="item.imageScale || 1"
      @close="previewOpen = false"
      @apply="applyPosition"
    >
      <template #default="{ position, scale }">
        <div class="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
          <div v-if="item.imageKey" class="h-40 bg-neutral-100" :style="{ backgroundImage: `url(/api/images/${item.imageKey})`, backgroundPosition: position, backgroundSize: `${scale * 100}%`, backgroundRepeat: 'no-repeat' }" />
          <div class="p-5">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-display text-lg font-semibold text-neutral-900">{{ item.name }}</h3>
              <span class="font-display text-lg font-semibold text-neutral-900">${{ item.price.toFixed(2) }}</span>
            </div>
            <p v-if="item.description" class="font-body text-sm text-neutral-500 leading-relaxed">{{ item.description }}</p>
          </div>
        </div>
      </template>
    </AdminImagePreview>
  </div>
</template>
