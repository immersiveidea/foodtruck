<script setup lang="ts">
import { useAdminApi } from '../../composables/useAdminApi'
import { useAdminData } from '../../composables/useAdminData'

const { loading, adminSave } = useAdminApi()
const { socialLinksData } = useAdminData()

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

function addSocialLink() {
  socialLinksData.value.links.push({ platform: 'facebook', url: '', showInHeader: false, showInFooter: true })
}

function removeSocialLink(index: number) {
  socialLinksData.value.links.splice(index, 1)
}

async function saveSocialLinks() {
  await adminSave('/api/admin/sociallinks', socialLinksData.value, 'Social links saved successfully')
}
</script>

<template>
  <div class="space-y-6">
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
</template>
