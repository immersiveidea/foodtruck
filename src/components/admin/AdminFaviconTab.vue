<script setup lang="ts">
import { useAdminApi } from '../../composables/useAdminApi'
import { useAdminData } from '../../composables/useAdminData'
import { useAdminFavicon } from '../../composables/useAdminFavicon'

const { loading, adminSave } = useAdminApi()
const { faviconData } = useAdminData()
const { uploadingFavicon, uploadFavicon, removeFavicon } = useAdminFavicon()

async function saveFavicon() {
  await adminSave('/api/admin/favicon', faviconData.value, 'Favicon settings saved successfully')
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold mb-4">Favicon</h2>
      <p class="text-sm text-neutral-500 mb-6">Upload a source image (minimum 512x512, square preferred) to generate all favicon variants for browsers, iOS, and Android.</p>

      <div class="mb-6 p-4 rounded-lg" :class="faviconData.hasCustomFavicon ? 'bg-green-50 border border-green-200' : 'bg-neutral-50 border border-neutral-200'">
        <p class="text-sm font-medium" :class="faviconData.hasCustomFavicon ? 'text-green-800' : 'text-neutral-600'">
          {{ faviconData.hasCustomFavicon ? 'Custom favicon is active' : 'No custom favicon set (using browser defaults)' }}
        </p>
      </div>

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
              <img :src="'/api/images/favicon/android-chrome-192x192.png'" alt="192x192" class="block" style="width: 64px; height: 64px;" />
            </div>
            <p class="text-xs text-neutral-400 mt-1">192x192 (Android)</p>
          </div>
          <div class="text-center">
            <div class="inline-block border border-neutral-200 rounded p-2 bg-white">
              <img :src="'/api/images/favicon/android-chrome-512x512.png'" alt="512x512" class="block" style="width: 80px; height: 80px;" />
            </div>
            <p class="text-xs text-neutral-400 mt-1">512x512 (PWA)</p>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <span class="text-sm text-neutral-600 block mb-2">{{ faviconData.hasCustomFavicon ? 'Replace Favicon' : 'Upload Source Image' }}</span>
        <div class="flex items-center gap-3">
          <label class="cursor-pointer">
            <span :class="['inline-block text-sm px-3 py-1.5 rounded border', uploadingFavicon ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50']">
              {{ uploadingFavicon ? 'Generating variants...' : 'Choose Image' }}
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" :disabled="uploadingFavicon" @change="uploadFavicon" />
          </label>
          <span class="text-xs text-neutral-400">JPEG, PNG, or WebP. Min 512x512, square preferred.</span>
        </div>
      </div>

      <div v-if="faviconData.hasCustomFavicon" class="mb-6">
        <button @click="removeFavicon" :disabled="loading" class="text-sm bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50">Remove Custom Favicon</button>
      </div>

      <div class="border-t border-neutral-200 pt-6 space-y-4">
        <h3 class="font-medium">Web Manifest Settings</h3>
        <p class="text-sm text-neutral-500">These settings are used in the web app manifest for Android/PWA.</p>
        <label class="block">
          <span class="text-sm text-neutral-600">Site Name</span>
          <input v-model="faviconData.siteName" class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none" placeholder="My Food Truck" />
        </label>
        <label class="block">
          <span class="text-sm text-neutral-600">Theme Color</span>
          <div class="flex items-center gap-3 mt-1">
            <input v-model="faviconData.themeColor" type="color" class="w-10 h-10 rounded border border-neutral-300 cursor-pointer" />
            <input v-model="faviconData.themeColor" type="text" class="flex-1 rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none font-mono text-sm" placeholder="#ffffff" />
          </div>
        </label>
      </div>

      <div class="border-t border-neutral-200 pt-6 space-y-4">
        <h3 class="font-medium">SEO Settings</h3>
        <p class="text-sm text-neutral-500">Set a meta description to improve how your site appears in search engine results.</p>
        <label class="block">
          <span class="text-sm text-neutral-600">Meta Description</span>
          <textarea v-model="faviconData.metaDescription" rows="3" maxlength="160" class="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none text-sm" placeholder="A short description of your food truck for search engines (max 160 characters)"></textarea>
          <span class="text-xs text-neutral-400 mt-1 block">{{ faviconData.metaDescription?.length || 0 }}/160 characters</span>
        </label>
      </div>
    </div>

    <button @click="saveFavicon" :disabled="loading" class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50">
      {{ loading ? 'Saving...' : 'Save Favicon Settings' }}
    </button>
  </div>
</template>
