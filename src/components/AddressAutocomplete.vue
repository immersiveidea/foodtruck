<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAddressSearch, type AddressSuggestion } from '../composables/useAddressSearch'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select': [suggestion: AddressSuggestion]
}>()

const { suggestions, loading, search, clear, formatAddress } = useAddressSearch()

const inputValue = ref(props.modelValue)
const showSuggestions = ref(false)
const selectedIndex = ref(-1)

watch(() => props.modelValue, (newVal) => {
  inputValue.value = newVal
})

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  inputValue.value = value
  emit('update:modelValue', value)
  selectedIndex.value = -1
  showSuggestions.value = true
  search(value)
}

function selectSuggestion(suggestion: AddressSuggestion) {
  const formatted = formatAddress(suggestion)
  inputValue.value = formatted
  emit('update:modelValue', formatted)
  emit('select', suggestion)
  showSuggestions.value = false
  clear()
}

function onFocus() {
  if (suggestions.value.length > 0) {
    showSuggestions.value = true
  }
}

function onBlur() {
  // Delay to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

function onKeydown(event: KeyboardEvent) {
  if (!showSuggestions.value || suggestions.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
      if (selectedIndex.value >= 0) {
        event.preventDefault()
        selectSuggestion(suggestions.value[selectedIndex.value]!)
      }
      break
    case 'Escape':
      showSuggestions.value = false
      break
  }
}
</script>

<template>
  <div class="relative">
    <input
      :value="inputValue"
      type="text"
      :required="required"
      :placeholder="placeholder"
      class="block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
      autocomplete="off"
    />

    <!-- Loading indicator -->
    <div v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2">
      <svg class="w-4 h-4 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Suggestions dropdown -->
    <div
      v-if="showSuggestions && suggestions.length > 0"
      class="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto"
    >
      <button
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.display_name"
        type="button"
        :class="[
          'w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none',
          selectedIndex === index ? 'bg-neutral-100' : ''
        ]"
        @click="selectSuggestion(suggestion)"
      >
        <span class="block font-medium text-neutral-900">{{ formatAddress(suggestion) }}</span>
        <span class="block text-xs text-neutral-500 truncate">{{ suggestion.display_name }}</span>
      </button>
    </div>

    <!-- Attribution (required by Nominatim) -->
    <p v-if="showSuggestions && suggestions.length > 0" class="absolute -bottom-5 right-0 text-xs text-neutral-400">
      Powered by OpenStreetMap
    </p>
  </div>
</template>
