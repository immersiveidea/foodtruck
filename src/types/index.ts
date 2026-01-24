export interface MenuItem {
  name: string
  description: string
}

export interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

export interface MenuData {
  categories: MenuCategory[]
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
