import Stripe from 'stripe'
import type {
  PaymentProvider,
  CreateOnlineCheckoutParams,
  OnlineCheckoutResult,
  CreatePosPaymentParams,
  PosPaymentResult,
  CreatePosCheckoutLinkParams,
  PosCheckoutLinkResult,
  CreateTerminalPaymentParams,
  TerminalPaymentResult,
  TerminalPaymentStatus,
  WebhookValidationResult,
} from './types'

export class StripePaymentProvider implements PaymentProvider {
  readonly name = 'stripe' as const
  private stripe: Stripe
  private webhookSecret: string
  private publishableKey: string

  constructor(env: Record<string, string>) {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY)
    this.webhookSecret = env.STRIPE_WEBHOOK_SECRET || ''
    this.publishableKey = env.VITE_STRIPE_PUBLISHABLE_KEY || ''
  }

  async createOnlineCheckout(params: CreateOnlineCheckoutParams): Promise<OnlineCheckoutResult> {
    const session = await this.stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      payment_method_types: ['card'],
      line_items: params.lineItems.map(li => ({
        price_data: {
          currency: 'usd',
          product_data: { name: li.name },
          unit_amount: li.unitAmountCents,
        },
        quantity: li.quantity,
      })),
      mode: 'payment',
      return_url: `${params.origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: { orderId: params.orderId },
    })

    return {
      clientSecret: session.client_secret!,
      providerSessionId: session.id,
    }
  }

  async createPosPayment(params: CreatePosPaymentParams): Promise<PosPaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.totalCents,
      currency: 'usd',
      metadata: { orderId: params.orderId },
      automatic_payment_methods: { enabled: true },
    })

    return {
      clientSecret: paymentIntent.client_secret!,
      providerPaymentId: paymentIntent.id,
    }
  }

  async createPosCheckoutLink(params: CreatePosCheckoutLinkParams): Promise<PosCheckoutLinkResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: params.lineItems.map(li => ({
        price_data: {
          currency: 'usd',
          product_data: { name: li.name },
          unit_amount: li.unitAmountCents,
        },
        quantity: li.quantity,
      })),
      mode: 'payment',
      success_url: `${params.origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${params.origin}/admin/pos`,
      metadata: { orderId: params.orderId },
    })

    return {
      checkoutUrl: session.url!,
      providerSessionId: session.id,
    }
  }

  async createTerminalPayment(params: CreateTerminalPaymentParams): Promise<TerminalPaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.totalCents,
      currency: 'usd',
      payment_method_types: ['card_present'],
      capture_method: 'automatic',
      metadata: { orderId: params.orderId },
    })

    return {
      terminalPaymentId: paymentIntent.id,
      providerPaymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
    }
  }

  async getTerminalPaymentStatus(terminalPaymentId: string): Promise<TerminalPaymentStatus> {
    const pi = await this.stripe.paymentIntents.retrieve(terminalPaymentId)
    const statusMap: Record<string, TerminalPaymentStatus['status']> = {
      requires_payment_method: 'pending',
      requires_confirmation: 'in_progress',
      requires_action: 'in_progress',
      processing: 'in_progress',
      succeeded: 'completed',
      canceled: 'cancelled',
    }
    return {
      status: statusMap[pi.status] || 'pending',
      providerPaymentId: pi.id,
    }
  }

  async cancelTerminalPayment(terminalPaymentId: string): Promise<void> {
    await this.stripe.paymentIntents.cancel(terminalPaymentId)
  }

  async createTerminalConnectionToken(): Promise<{ secret: string }> {
    const token = await this.stripe.terminal.connectionTokens.create()
    return { secret: token.secret }
  }

  async validateWebhook(request: Request): Promise<WebhookValidationResult> {
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      return { valid: false, events: [] }
    }

    let event: Stripe.Event
    try {
      const body = await request.text()
      event = await this.stripe.webhooks.constructEventAsync(
        body,
        signature,
        this.webhookSecret
      )
    } catch {
      return { valid: false, events: [] }
    }

    const events: WebhookValidationResult['events'] = []

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.orderId
      if (orderId) {
        events.push({
          type: 'payment_completed',
          orderId,
          providerPaymentId: typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || '',
          customerName: session.customer_details?.name || undefined,
          customerEmail: session.customer_details?.email || undefined,
        })
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const orderId = paymentIntent.metadata?.orderId
      if (orderId) {
        events.push({
          type: 'payment_completed',
          orderId,
          providerPaymentId: paymentIntent.id,
        })
      }
    }

    return { valid: true, events }
  }

  getPublicConfig(): Record<string, string> {
    return {
      provider: 'stripe',
      publishableKey: this.publishableKey,
    }
  }
}
