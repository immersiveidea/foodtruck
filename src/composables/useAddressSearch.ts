import { ref } from 'vue'

export interface AddressSuggestion {
  display_name: string
  lat: string
  lon: string
  address?: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    state?: string
    postcode?: string
    country?: string
  }
}

export function useAddressSearch() {
  const suggestions = ref<AddressSuggestion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function search(query: string) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (!query || query.length < 3) {
      suggestions.value = []
      return
    }

    debounceTimer = setTimeout(async () => {
      loading.value = true
      error.value = null

      try {
        const params = new URLSearchParams({
          format: 'json',
          q: query,
          addressdetails: '1',
          limit: '5',
          countrycodes: 'us'
        })

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          {
            headers: {
              'User-Agent': 'YoYoBubbleTea-BookingForm/1.0'
            }
          }
        )

        if (res.ok) {
          suggestions.value = await res.json()
        } else {
          error.value = 'Failed to fetch address suggestions'
          suggestions.value = []
        }
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Failed to search addresses'
        suggestions.value = []
      } finally {
        loading.value = false
      }
    }, 300)
  }

  function clear() {
    suggestions.value = []
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  }

  function formatAddress(suggestion: AddressSuggestion): string {
    const addr = suggestion.address
    if (!addr) return suggestion.display_name

    const parts: string[] = []

    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`)
    } else if (addr.road) {
      parts.push(addr.road)
    }

    const city = addr.city || addr.town || addr.village
    if (city) {
      parts.push(city)
    }

    if (addr.state) {
      parts.push(addr.state)
    }

    if (addr.postcode) {
      parts.push(addr.postcode)
    }

    return parts.length > 0 ? parts.join(', ') : suggestion.display_name
  }

  return { suggestions, loading, error, search, clear, formatAddress }
}
