interface Env {
  CONTENT: KVNamespace
}

interface BookingSubmission {
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
}

interface BookingRequest extends BookingSubmission {
  id: string
  status: 'pending' | 'confirmed' | 'denied'
  createdAt: string
  adminNotes?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as BookingSubmission

    // Basic validation
    const required = ['name', 'email', 'phone', 'eventDate', 'eventTime', 'location', 'address', 'eventType', 'guestCount'] as const
    for (const field of required) {
      if (!body[field]) {
        return Response.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return Response.json({ success: false, error: 'Invalid email format' }, { status: 400 })
    }

    // Validate guest count
    if (typeof body.guestCount !== 'number' || body.guestCount < 1) {
      return Response.json({ success: false, error: 'Guest count must be a positive number' }, { status: 400 })
    }

    // Generate unique ID
    const id = `booking-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Create booking request
    const booking: BookingRequest = {
      id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      eventDate: body.eventDate,
      eventTime: body.eventTime,
      location: body.location,
      address: body.address,
      eventType: body.eventType,
      guestCount: body.guestCount,
      message: body.message,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    // Get existing bookings and append
    const existing = await context.env.CONTENT.get('bookings', 'json') as BookingRequest[] | null
    const bookings = existing ?? []
    bookings.push(booking)

    await context.env.CONTENT.put('bookings', JSON.stringify(bookings))

    return Response.json({ success: true, id })
  } catch {
    return Response.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
