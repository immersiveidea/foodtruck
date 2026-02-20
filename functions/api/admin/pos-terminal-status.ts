import { createPaymentProvider } from '../../lib/payments/factory'

interface Env {
  [key: string]: unknown
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return Response.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const provider = createPaymentProvider(context.env as unknown as Record<string, string>)
    const status = await provider.getTerminalPaymentStatus(id)

    return Response.json(status)
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
