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
