import Stripe from 'stripe'

interface Env {
  STRIPE_SECRET_KEY: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY)
    const connectionToken = await stripe.terminal.connectionTokens.create()

    return Response.json({ secret: connectionToken.secret })
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: errMsg }, { status: 500 })
  }
}
