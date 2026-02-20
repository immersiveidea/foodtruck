import { createPaymentProvider } from '../lib/payments/factory'

interface Env {
  [key: string]: unknown
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const provider = createPaymentProvider(context.env as unknown as Record<string, string>)
    return Response.json(provider.getPublicConfig())
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
