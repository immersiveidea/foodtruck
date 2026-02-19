<script setup lang="ts">
import { useAdminApi } from '../../composables/useAdminApi'
import { useAdminData } from '../../composables/useAdminData'

const { loading } = useAdminApi()
const { aboutData } = useAdminData()
const { adminSave } = useAdminApi()

function addParagraph() {
  aboutData.value.paragraphs.push('')
}

function removeParagraph(index: number) {
  aboutData.value.paragraphs.splice(index, 1)
}

async function saveAbout() {
  await adminSave('/api/admin/about', aboutData.value, 'About content saved successfully')
}
</script>

<template>
  <div class="space-y-6">
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
</template>
