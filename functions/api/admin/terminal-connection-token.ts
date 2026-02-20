import { createPaymentProvider } from '../../lib/payments/factory'

interface Env {
  [key: string]: unknown
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const provider = createPaymentProvider(context.env as unknown as Record<string, string>)

    if (!provider.createTerminalConnectionToken) {
      return Response.json({ error: 'Connection tokens not supported by this provider' }, { status: 400 })
    }

    const { secret } = await provider.createTerminalConnectionToken()
    return Response.json({ secret })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
