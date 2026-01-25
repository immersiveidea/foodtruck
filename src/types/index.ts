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
  items: MenuItem[]
}

export interface MenuData {
  categories: MenuCategory[]
  footerText?: string  // Optional footer text displayed below the menu
}

export interface ScheduleLocation {
  id: number
  day: string
  date: string
  location: string
  address: string
  time: string
  lat: number
  lng: number
}

export type ScheduleData = ScheduleLocation[]

export type BookingStatus = 'pending' | 'confirmed' | 'denied'

export interface BookingRequest {
  id: string
  name: string
  email: string
  phone: string
  eventDate: string
  eventTime: string
  location: string
  address: string
  eventType: string
  guestCount: number
  message?: string
  status: BookingStatus
  createdAt: string
  adminNotes?: string
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
