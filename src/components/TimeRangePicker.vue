<script setup lang="ts">
import { computed } from 'vue'
import { formatTimeRange } from '../composables/useDateTimeFormat'

const props = withDefaults(defineProps<{
  startTime: string
  endTime: string
  required?: boolean
  showPreview?: boolean
}>(), {
  required: false,
  showPreview: true
})

const emit = defineEmits<{
  'update:startTime': [value: string]
  'update:endTime': [value: string]
}>()

const formattedRange = computed(() => {
  if (!props.startTime || !props.endTime) return ''
  return formatTimeRange(props.startTime, props.endTime)
})
</script>

<template>
  <div class="space-y-2">
    <div class="grid grid-cols-2 gap-4">
      <label class="block">
        <span class="text-sm text-neutral-600">Start Time<span v-if="required" class="text-red-500"> *</span></span>
        <input
          :value="startTime"
          @input="emit('update:startTime', ($event.target as HTMLInputElement).value)"
          type="time"
          :required="required"
          class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
        />
      </label>
      <label class="block">
        <span class="text-sm text-neutral-600">End Time<span v-if="required" class="text-red-500"> *</span></span>
        <input
          :value="endTime"
          @input="emit('update:endTime', ($event.target as HTMLInputElement).value)"
          type="time"
          :required="required"
          class="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-neutral-500 focus:outline-none"
        />
      </label>
    </div>
    <p v-if="showPreview && formattedRange" class="text-sm text-neutral-500">
      {{ formattedRange }}
    </p>
  </div>
</template>
