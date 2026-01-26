<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  lat: number
  lng: number
}>()

const emit = defineEmits<{
  'update:lat': [value: number]
  'update:lng': [value: number]
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null

// Fix Leaflet default marker icon issue with bundlers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function updateMarkerPosition(lat: number, lng: number) {
  if (marker) {
    marker.setLatLng([lat, lng])
  }
  if (map) {
    map.setView([lat, lng], map.getZoom())
  }
}

function onMarkerDrag(e: L.LeafletEvent) {
  const latlng = (e.target as L.Marker).getLatLng()
  emit('update:lat', parseFloat(latlng.lat.toFixed(6)))
  emit('update:lng', parseFloat(latlng.lng.toFixed(6)))
}

function onMapClick(e: L.LeafletMouseEvent) {
  const { lat, lng } = e.latlng
  emit('update:lat', parseFloat(lat.toFixed(6)))
  emit('update:lng', parseFloat(lng.toFixed(6)))
  if (marker) {
    marker.setLatLng([lat, lng])
  }
}

// Watch for prop changes to re-center map
watch([() => props.lat, () => props.lng], ([newLat, newLng]) => {
  if (map && marker && newLat && newLng) {
    updateMarkerPosition(newLat, newLng)
  }
})

onMounted(() => {
  if (!mapContainer.value) return

  // Initialize map
  map = L.map(mapContainer.value).setView([props.lat || 40.48, props.lng || -104.90], 13)

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)

  // Add draggable marker
  marker = L.marker([props.lat || 40.48, props.lng || -104.90], {
    draggable: true,
    icon: defaultIcon
  }).addTo(map)

  // Handle marker drag
  marker.on('dragend', onMarkerDrag)

  // Handle map click
  map.on('click', onMapClick)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
    marker = null
  }
})
</script>

<template>
  <div ref="mapContainer" class="h-48 w-full rounded-lg border border-neutral-300"></div>
</template>

<style scoped>
/* Ensure Leaflet controls are visible */
:deep(.leaflet-control-zoom) {
  border: none !important;
}

:deep(.leaflet-control-zoom a) {
  background-color: white !important;
  color: #333 !important;
  border: 1px solid #ccc !important;
}

:deep(.leaflet-control-zoom a:hover) {
  background-color: #f4f4f4 !important;
}
</style>
