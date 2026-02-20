import { createPaymentProvider } from '../../lib/payments/factory'

interface Env {
  [key: string]: unknown
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { id: string }

    if (!body.id) {
      return Response.json({ error: 'Missing id' }, { status: 400 })
    }

    const provider = createPaymentProvider(context.env as unknown as Record<string, string>)
    await provider.cancelTerminalPayment(body.id)

    return Response.json({ success: true })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
