# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `npm run build` - Type-check with vue-tsc and build for production
- `npm run preview` - Preview production build locally

## Tech Stack

- **Framework**: Vue 3 with `<script setup>` SFCs
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4 (using @tailwindcss/vite plugin)

## Project Structure

- `src/main.ts` - Application entry point, mounts Vue app and imports global styles
- `src/App.vue` - Root component
- `src/components/` - Vue components
- `src/style.css` - Tailwind CSS entry point (`@import "tailwindcss"`)
- `vite.config.ts` - Vite configuration with Vue and Tailwind plugins

## TypeScript Configuration

Uses Vue's recommended tsconfig setup with project references:
- `tsconfig.app.json` - App source configuration
- `tsconfig.node.json` - Node/Vite configuration

## Updating the Schedule

The schedule data in `src/components/ScheduleSection.vue` comes from StreetFoodFinder. To refresh:

1. Open https://streetfoodfinder.com/yoyobubbleteaco?tab=calendar in your browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the Console tab
4. Copy and paste the contents of `scripts/scrape-calendar.js`
5. Press Enter to run the script
6. Copy the JSON output
7. Update the `schedule` array in `src/components/ScheduleSection.vue`
8. Add lat/lng coordinates using Google Maps or https://www.latlong.net/
9. Run `npm run build` to verify

Note: Windsor, CO coordinates are approximately lat: 40.48, lng: -104.90
