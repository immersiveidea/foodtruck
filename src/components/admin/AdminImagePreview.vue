<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  imageUrl: string
  initialPosition?: string
  initialScale?: number
  minScale?: number
}>()

const emit = defineEmits<{
  close: []
  apply: [position: string, scale: number]
}>()

const position = ref(props.initialPosition || 'center')
const scale = ref(props.initialScale || 1)
const minScaleVal = props.minScale ?? 0.5

watch(() => props.open, (val) => {
  if (val) {
    position.value = props.initialPosition || 'center'
    scale.value = props.initialScale || 1
  }
})

const positions = ['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right']
const posLabels: Record<string, string> = {
  'top left': 'TL', 'top': 'T', 'top right': 'TR',
  'left': 'L', 'center': 'C', 'right': 'R',
  'bottom left': 'BL', 'bottom': 'B', 'bottom right': 'BR',
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-neutral-50 rounded-lg p-6 max-w-lg w-full mx-4">
      <h3 class="text-lg font-semibold mb-4">{{ title }}</h3>

      <slot :position="position" :scale="scale" />

      <div class="mt-4">
        <p class="text-sm text-neutral-600 mb-2">Image focal point:</p>
        <div class="grid grid-cols-3 gap-1 w-32 mx-auto">
          <button
            v-for="pos in positions"
            :key="pos"
            @click="position = pos"
            :class="[
              'w-10 h-10 rounded text-xs border',
              position === pos
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-100'
            ]"
            :title="pos"
          >
            {{ posLabels[pos] }}
          </button>
        </div>

        <div class="mt-4">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-neutral-600">Zoom:</span>
            <span class="text-sm text-neutral-500">{{ scale < 1 ? `-${Math.round((1 - scale) * 100)}%` : scale > 1 ? `+${Math.round((scale - 1) * 100)}%` : '0%' }}</span>
          </div>
          <input
            v-model.number="scale"
            type="range"
            :min="minScaleVal"
            max="2"
            step="0.05"
            class="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
          />
          <div class="flex justify-between text-xs text-neutral-400 mt-1">
            <span>Zoom out</span>
            <span>1x</span>
            <span>Zoom in</span>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-4">
        <button
          @click="emit('close')"
          class="flex-1 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          @click="emit('apply', position, scale)"
          class="flex-1 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
</template>
