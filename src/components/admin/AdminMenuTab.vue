<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi'
import { useAdminData } from '../../composables/useAdminData'
import AdminMenuItemCard from './AdminMenuItemCard.vue'

const { loading, message, deleteImageFromR2, adminSave } = useAdminApi()
const { menuData } = useAdminData()

const selectedCategoryId = ref<string | null>(menuData.value.categories[0]?.id ?? null)
const fileInput = ref<HTMLInputElement | null>(null)

const selectedCategory = computed(() =>
  menuData.value.categories.find(c => c.id === selectedCategoryId.value)
)

function addCategory() {
  const id = `category-${Date.now()}`
  menuData.value.categories.push({ id, name: 'New Category', items: [] })
  selectedCategoryId.value = id
}

function removeCategory(id: string) {
  menuData.value.categories = menuData.value.categories.filter(c => c.id !== id)
  if (selectedCategoryId.value === id) {
    selectedCategoryId.value = menuData.value.categories[0]?.id ?? null
  }
}

function addMenuItem() {
  if (!selectedCategory.value) return
  selectedCategory.value.items.push({ name: 'New Item', description: '', price: 0 })
}

function removeMenuItem(index: number) {
  if (!selectedCategory.value) return
  const item = selectedCategory.value.items[index]
  if (item?.imageKey) deleteImageFromR2(item.imageKey)
  selectedCategory.value.items.splice(index, 1)
}

function exportMenu() {
  const json = JSON.stringify(menuData.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'menu.json'
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  fileInput.value?.click()
}

function importMenu(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.categories && Array.isArray(data.categories)) {
        menuData.value = data
        if (menuData.value.categories.length > 0) {
          selectedCategoryId.value = menuData.value.categories[0]!.id
        }
        message.value = { type: 'success', text: 'Menu imported successfully. Click "Save Menu" to persist changes.' }
      } else {
        message.value = { type: 'error', text: 'Invalid menu format. Expected { categories: [...] }' }
      }
    } catch {
      message.value = { type: 'error', text: 'Failed to parse JSON file' }
    }
  }
  reader.readAsText(file)
  input.value = ''
}

async function saveMenu() {
  await adminSave('/api/admin/menu', menuData.value, 'Menu saved successfully')
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-lg shadow p-4 flex justify-between items-center">
      <span class="text-sm text-neutral-600">Bulk update menu via JSON file</span>
      <div class="flex gap-2">
        <button @click="exportMenu" class="text-sm border border-neutral-300 text-neutral-700 px-3 py-1 rounded hover:bg-neutral-50">Export JSON</button>
        <button @click="triggerImport" class="text-sm border border-neutral-300 text-neutral-700 px-3 py-1 rounded hover:bg-neutral-50">Import JSON</button>
        <input ref="fileInput" type="file" accept=".json,application/json" class="hidden" @change="importMenu" />
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Categories</h2>
        <button @click="addCategory" class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800">Add Category</button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="category in menuData.categories"
          :key="category.id"
          @click="selectedCategoryId = category.id"
          :class="['px-3 py-1 rounded-full text-sm border', selectedCategoryId === category.id ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50']"
        >
          {{ category.name }}{{ category.default ? ' ★' : '' }}
        </button>
      </div>
    </div>

    <div v-if="selectedCategory" class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <input v-model="selectedCategory.name" class="text-lg font-semibold border-b border-transparent focus:border-neutral-300 focus:outline-none" />
        <div class="flex gap-2">
          <button @click="addMenuItem" class="text-sm bg-neutral-900 text-white px-3 py-1 rounded hover:bg-neutral-800">Add Item</button>
          <button @click="removeCategory(selectedCategory.id)" class="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Delete Category</button>
        </div>
      </div>
      <label class="flex items-center gap-2 mb-4 text-sm text-neutral-600">
        <input type="checkbox" v-model="selectedCategory.default" class="rounded" />
        Show on initial load
      </label>
      <div class="space-y-4">
        <AdminMenuItemCard
          v-for="(item, index) in selectedCategory.items"
          :key="index"
          :item="item"
          :index="index"
          @remove="removeMenuItem"
        />
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold mb-2">Menu Footer</h2>
      <p class="text-sm text-neutral-500 mb-4">Optional text displayed below the menu items (e.g., toppings info, specials).</p>
      <textarea v-model="menuData.footerText" rows="2" class="w-full rounded border border-neutral-300 px-3 py-2 focus:border-neutral-400 focus:outline-none text-sm" placeholder="Add tapioca pearls, popping boba, grass jelly, or other toppings to any drink!"></textarea>
    </div>

    <button @click="saveMenu" :disabled="loading" class="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50">
      {{ loading ? 'Saving...' : 'Save Menu' }}
    </button>
  </div>
</template>
