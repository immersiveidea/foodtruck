interface Env {
  CONTENT: KVNamespace
}

interface BookingRequest {
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
  private?: boolean
  status: 'pending' | 'confirmed' | 'denied'
  createdAt: string
  adminNotes?: string
}

interface UpdateRequest {
  id: string
  status: 'pending' | 'confirmed' | 'denied'
  adminNotes?: string
  private?: boolean
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const bookings = await context.env.CONTENT.get('bookings', 'json') as BookingRequest[] | null
  return Response.json(bookings ?? [])
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as UpdateRequest

    if (!body.id || !body.status) {
      return Response.json({ success: false, error: 'Missing id or status' }, { status: 400 })
    }

    if (!['pending', 'confirmed', 'denied'].includes(body.status)) {
      return Response.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const bookings = await context.env.CONTENT.get('bookings', 'json') as BookingRequest[] | null
    if (!bookings) {
      return Response.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    const index = bookings.findIndex(b => b.id === body.id)
    if (index === -1) {
      return Response.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    bookings[index].status = body.status
    if (body.adminNotes !== undefined) {
      bookings[index].adminNotes = body.adminNotes
    }
    if (body.private !== undefined) {
      bookings[index].private = body.private
    }

    await context.env.CONTENT.put('bookings', JSON.stringify(bookings))

    return Response.json({ success: true })
  } catch {
    return Response.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
