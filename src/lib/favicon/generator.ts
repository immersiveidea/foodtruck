export interface FaviconVariant {
  key: string
  size: number
  blob: Blob
}

const VARIANTS = [
  { key: 'favicon/favicon.ico', size: 32 },
  { key: 'favicon/favicon-16x16.png', size: 16 },
  { key: 'favicon/favicon-32x32.png', size: 32 },
  { key: 'favicon/apple-touch-icon.png', size: 180 },
  { key: 'favicon/android-chrome-192x192.png', size: 192 },
  { key: 'favicon/android-chrome-512x512.png', size: 512 },
]

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

function centerCropAndResize(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Center-crop to square
  const minDim = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - minDim) / 2
  const sy = (img.naturalHeight - minDim) / 2

  ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
      type,
      1.0
    )
  })
}

export function validateSourceImage(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'File too large. Maximum size is 10MB.'
  }
  return null
}

export async function validateImageDimensions(file: File): Promise<string | null> {
  const img = await loadImage(file)
  URL.revokeObjectURL(img.src)
  if (img.naturalWidth < 512 || img.naturalHeight < 512) {
    return `Image must be at least 512x512 pixels. Yours is ${img.naturalWidth}x${img.naturalHeight}.`
  }
  return null
}

export async function generateFaviconVariants(file: File): Promise<FaviconVariant[]> {
  const img = await loadImage(file)

  const variants: FaviconVariant[] = []

  for (const { key, size } of VARIANTS) {
    const canvas = centerCropAndResize(img, size)
    const blob = await canvasToBlob(canvas, 'image/png')
    variants.push({ key, size, blob })
  }

  URL.revokeObjectURL(img.src)
  return variants
}
