export interface MenuItem {
  name: string
  description?: string
  price: number
  imageKey?: string
  imagePosition?: string  // CSS object-position value, e.g., "center", "top left"
  imageScale?: number     // Scale factor for zoom/crop, default 1 (range 1-2)
}

export interface MenuCategory {
  id: string
  name: string
  default?: boolean
  items: MenuItem[]
}

export interface MenuData {
  categories: MenuCategory[]
  footerText?: string  // Optional footer text displayed below the menu
}

export interface ScheduleLocation {
  id: number
  date: string           // ISO format YYYY-MM-DD
  startTime: string      // 24-hour format HH:MM
  endTime: string        // 24-hour format HH:MM
  location: string
  address: string
  lat: number
  lng: number
  duration?: string      // Optional descriptive duration (e.g., "4 hours")
  private?: boolean      // If true, location details are hidden on public site
  bookingId?: string     // Links this event to a confirmed booking
  priceOverrides?: Record<string, number>  // Key: "categoryId:itemName" → override price
  // Legacy fields for backward compatibility
  day?: string           // Deprecated: computed from date
  time?: string          // Deprecated: use startTime/endTime
}

export type ScheduleData = ScheduleLocation[]

export type BookingStatus = 'pending' | 'confirmed' | 'denied'

export interface BookingRequest {
  id: string
  name: string
  email: string
  phone: string
  eventDate: string
  startTime: string        // 24-hour format HH:MM
  endTime: string          // 24-hour format HH:MM
  location: string
  address: string
  eventType: string
  guestCount: number
  message?: string
  private?: boolean      // If true, this is a private event
  status: BookingStatus
  createdAt: string
  adminNotes?: string
  // Legacy field for backward compatibility
  eventTime?: string       // Deprecated: use startTime/endTime
}

export type BookingsData = BookingRequest[]

export interface HeroContent {
  title: string
  tagline: string
  ctaText: string
  ctaLink: string
  imageKey?: string
  imagePosition?: string  // CSS object-position value, e.g., "center", "top left"
  imageScale?: number     // Scale factor for zoom/crop, default 1 (range 0.5-2)
}

export interface AboutContent {
  heading: string
  paragraphs: string[]
}

export interface FaviconContent {
  hasCustomFavicon: boolean
  siteName: string
  themeColor: string
  metaDescription: string
}

export interface SocialLink {
  platform: string   // simple-icons slug e.g. 'facebook', 'instagram', 'tiktok'
  url: string        // full URL e.g. 'https://facebook.com/yoyobubbleteaco'
  showInHeader: boolean
  showInFooter: boolean
}

export interface SocialLinksContent {
  links: SocialLink[]
}

export interface SiteSettings {
  onlineOrderingEnabled: boolean
}

export interface CartItem {
  categoryId: string
  itemName: string
  quantity: number
  unitPrice: number
}

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled'
export type PrepStatus = 'queued' | 'started' | 'done'
export type PaymentMethod = 'online' | 'pos_card' | 'pos_qr' | 'pos_terminal' | 'cash' | 'card_external'
  | 'stripe_online' | 'stripe_pos' | 'stripe_qr' | 'stripe_terminal' // deprecated, kept for old orders
export type OrderSource = 'online' | 'pos'

export interface OrderLineItem {
  categoryId: string
  itemName: string
  quantity: number
  unitPrice: number
  notes?: string[]              // per-unit customization notes, length = quantity
  prepStatuses?: PrepStatus[]  // per-unit prep tracking, length = quantity
}

export interface Order {
  id: string
  items: OrderLineItem[]
  total: number
  customerName?: string
  customerEmail?: string
  status: OrderStatus
  providerSessionId?: string
  providerPaymentId?: string
  paymentProvider?: 'stripe' | 'square'
  // Deprecated: kept for backward compat with existing KV data
  stripeSessionId?: string
  stripePaymentIntentId?: string
  source?: OrderSource
  paymentMethod?: PaymentMethod
  cashTendered?: number
  changeDue?: number
  createdAt: string
  updatedAt: string
  adminNotes?: string
}

export interface CheckoutRequestItem {
  categoryId: string
  itemName: string
  quantity: number
  notes?: string[]
}
