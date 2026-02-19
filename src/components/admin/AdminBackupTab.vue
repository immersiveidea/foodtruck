<script setup lang="ts">
import { useAdminBackup } from '../../composables/useAdminBackup'
import { useAdminData } from '../../composables/useAdminData'

const { backupLoading, backupProgress, restoreFile, createBackup, restoreBackup } = useAdminBackup()
const { loadAllData } = useAdminData()

function onRestoreFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  restoreFile.value = input.files?.[0] || null
}

async function handleRestore() {
  const ok = await restoreBackup()
  if (ok) {
    await loadAllData()
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold mb-4">Backup & Restore</h2>
      <p class="text-sm text-neutral-500 mb-6">Download a complete backup of your site content and images, or restore from a previous backup.</p>

      <div v-if="backupProgress" class="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg">
        <div class="flex items-center gap-3">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ backupProgress }}</span>
        </div>
      </div>

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
            @click="handleRestore"
            :disabled="backupLoading"
            class="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {{ backupLoading ? 'Restoring...' : 'Restore Backup' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
