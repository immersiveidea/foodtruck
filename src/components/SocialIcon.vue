<script setup lang="ts">
import {
  siFacebook,
  siInstagram,
  siTiktok,
  siX,
  siYoutube,
  siSnapchat,
  siPinterest,
  siThreads,
  siYelp,
  siLinktree,
} from 'simple-icons'

const props = withDefaults(defineProps<{
  platform: string
  size?: number
}>(), {
  size: 20
})

const iconMap: Record<string, { path: string; title: string }> = {
  facebook: { path: siFacebook.path, title: siFacebook.title },
  instagram: { path: siInstagram.path, title: siInstagram.title },
  tiktok: { path: siTiktok.path, title: siTiktok.title },
  x: { path: siX.path, title: siX.title },
  youtube: { path: siYoutube.path, title: siYoutube.title },
  snapchat: { path: siSnapchat.path, title: siSnapchat.title },
  pinterest: { path: siPinterest.path, title: siPinterest.title },
  threads: { path: siThreads.path, title: siThreads.title },
  yelp: { path: siYelp.path, title: siYelp.title },
  linktree: { path: siLinktree.path, title: siLinktree.title },
  streetfoodfinder: { path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm-1.5 4h1v4h-1V4zm3 0h1v4h-1V4zm-1.5 5c.83 0 1.5.67 1.5 1.5S12.83 12 12 12s-1.5-.67-1.5-1.5S11.17 9 12 9z', title: 'StreetFoodFinder' },
}

const icon = iconMap[props.platform]
</script>

<template>
  <svg
    v-if="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="currentColor"
    role="img"
    :aria-label="icon.title"
  >
    <path :d="icon.path" />
  </svg>
  <span v-else>{{ platform }}</span>
</template>
