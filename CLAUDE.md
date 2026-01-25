# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `npm run build` - Type-check with vue-tsc and build for production
- `npm run preview` - Preview production build locally
- `npm run pages:dev` - Run locally with Cloudflare Pages dev server (includes KV/R2)

## Tech Stack

- **Framework**: Vue 3 with `<script setup>` SFCs
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4 (using @tailwindcss/vite plugin)
- **Hosting**: Cloudflare Pages with Functions
- **Storage**: Cloudflare KV (content) and R2 (images)

## Project Structure

- `src/main.ts` - Application entry point, mounts Vue app and imports global styles
- `src/App.vue` - Root component
- `src/components/` - Vue components
- `src/pages/` - Page components (AdminPage.vue)
- `src/style.css` - Tailwind CSS entry point (`@import "tailwindcss"`)
- `functions/` - Cloudflare Pages Functions (API endpoints)
- `vite.config.ts` - Vite configuration with Vue and Tailwind plugins
- `wrangler.toml` - Cloudflare configuration (KV/R2 bindings)

## TypeScript Configuration

Uses Vue's recommended tsconfig setup with project references:
- `tsconfig.app.json` - App source configuration
- `tsconfig.node.json` - Node/Vite configuration

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier works)
- Wrangler CLI: `npm install -g wrangler`

### 1. Clone and Install Dependencies

```bash
git clone <repo-url>
cd foodtruck
npm install
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser to authenticate with your Cloudflare account.

### 3. Create KV Namespace

Create a KV namespace for storing menu, schedule, bookings, and content data:

```bash
# Create production namespace
wrangler kv namespace create CONTENT

# Create preview namespace (for local dev)
wrangler kv namespace create CONTENT --preview
```

Copy the `id` values from the output and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CONTENT"
id = "<your-production-id>"
preview_id = "<your-preview-id>"
```

### 4. Create R2 Bucket

Create an R2 bucket for storing menu item images:

```bash
# Create production bucket
wrangler r2 bucket create foodtruck-images

# Create preview bucket (for local dev)
wrangler r2 bucket create foodtruck-images-preview
```

Update `wrangler.toml` with your bucket names:

```toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "foodtruck-images"
preview_bucket_name = "foodtruck-images-preview"
```

### 5. Create Cloudflare Pages Project

Option A: Via Dashboard
1. Go to Cloudflare Dashboard > Pages
2. Create a project and connect your Git repository
3. Set build command: `npm run build`
4. Set output directory: `dist`

Option B: Via Wrangler
```bash
wrangler pages project create foodtruck
```

### 6. Configure Environment Variables

Set the admin key for the admin panel authentication:

**For production (Cloudflare Dashboard):**
1. Go to Pages > your project > Settings > Environment variables
2. Add variable: `ADMIN_KEY` = `<your-secret-key>`

**For local development:**
Create a `.dev.vars` file in the project root:
```
ADMIN_KEY=your-local-admin-key
```

> **Important:** Never commit `.dev.vars` to git. It should be in `.gitignore`.

### 7. Bind KV and R2 to Pages Project

In Cloudflare Dashboard:
1. Go to Pages > your project > Settings > Functions
2. Under "KV namespace bindings", add:
   - Variable name: `CONTENT`
   - KV namespace: Select your `foodtruck-content` namespace
3. Under "R2 bucket bindings", add:
   - Variable name: `IMAGES`
   - R2 bucket: Select your `foodtruck-images` bucket

### 8. Deploy

**Automatic deploys:** Push to your connected Git repository.

**Manual deploy:**
```bash
npm run build
wrangler pages deploy dist
```

### 9. Local Development

```bash
# Build the frontend first
npm run build

# Run with Cloudflare Pages dev server (includes KV/R2 bindings)
npm run pages:dev
```

The app will be available at `http://localhost:8788`. The admin panel is at `/admin`.

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/menu` | GET | No | Get menu data |
| `/api/schedule` | GET | No | Get schedule data |
| `/api/hero` | GET | No | Get hero content |
| `/api/about` | GET | No | Get about content |
| `/api/bookings` | POST | No | Submit booking request |
| `/api/images/:key` | GET | No | Get image from R2 |
| `/api/admin/menu` | GET/POST | Yes | Manage menu |
| `/api/admin/schedule` | GET/POST | Yes | Manage schedule |
| `/api/admin/bookings` | GET/POST | Yes | Manage bookings |
| `/api/admin/hero` | GET/POST | Yes | Manage hero content |
| `/api/admin/about` | GET/POST | Yes | Manage about content |
| `/api/admin/images` | POST/DELETE | Yes | Upload/delete images |

Admin endpoints require `X-Admin-Key` header matching the `ADMIN_KEY` environment variable.

---

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

Note: Windsor, CO coordinates are approximately lat: 40.48, lng: -104.90
