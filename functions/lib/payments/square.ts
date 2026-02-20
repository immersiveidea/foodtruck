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

export class SquarePaymentProvider implements PaymentProvider {
  readonly name = 'square' as const
  private accessToken: string
  private locationId: string
  private applicationId: string
  private environment: string
  private webhookSignatureKey: string
  private baseUrl: string

  constructor(env: Record<string, string>) {
    this.accessToken = env.SQUARE_ACCESS_TOKEN || ''
    this.locationId = env.SQUARE_LOCATION_ID || ''
    this.applicationId = env.SQUARE_APPLICATION_ID || ''
    this.environment = env.SQUARE_ENVIRONMENT || 'sandbox'
    this.webhookSignatureKey = env.SQUARE_WEBHOOK_SIGNATURE_KEY || ''
    this.baseUrl = this.environment === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com'
  }

  private async squareRequest(path: string, options: RequestInit = {}): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Square-Version': '2024-11-20',
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }

  private generateIdempotencyKey(): string {
    return crypto.randomUUID()
  }

  async createOnlineCheckout(params: CreateOnlineCheckoutParams): Promise<OnlineCheckoutResult> {
    const orderLineItems = params.lineItems.map(li => ({
      name: li.name,
      quantity: String(li.quantity),
      base_price_money: {
        amount: li.unitAmountCents,
        currency: 'USD',
      },
    }))

    const res = await this.squareRequest('/v2/online-checkout/payment-links', {
      method: 'POST',
      body: JSON.stringify({
        idempotency_key: this.generateIdempotencyKey(),
        quick_pay: undefined,
        order: {
          location_id: this.locationId,
          line_items: orderLineItems,
          metadata: { orderId: params.orderId },
        },
        checkout_options: {
          redirect_url: `${params.origin}/order/success?session_id=sq_${params.orderId}`,
        },
      }),
    })

    const data = await res.json() as {
      payment_link?: { id: string; url: string; order_id: string }
      errors?: Array<{ detail: string }>
    }

    if (!res.ok || !data.payment_link) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to create Square checkout')
    }

    return {
      checkoutUrl: data.payment_link.url,
      providerSessionId: data.payment_link.id,
    }
  }

  async createPosPayment(params: CreatePosPaymentParams): Promise<PosPaymentResult> {
    if (!params.sourceId) {
      throw new Error('Square POS payment requires a sourceId (card nonce)')
    }

    const res = await this.squareRequest('/v2/payments', {
      method: 'POST',
      body: JSON.stringify({
        idempotency_key: this.generateIdempotencyKey(),
        source_id: params.sourceId,
        amount_money: {
          amount: params.totalCents,
          currency: 'USD',
        },
        location_id: this.locationId,
        note: `Order ${params.orderId}`,
        reference_id: params.orderId,
      }),
    })

    const data = await res.json() as {
      payment?: { id: string }
      errors?: Array<{ detail: string }>
    }

    if (!res.ok || !data.payment) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to create Square payment')
    }

    return {
      providerPaymentId: data.payment.id,
    }
  }

  async createPosCheckoutLink(params: CreatePosCheckoutLinkParams): Promise<PosCheckoutLinkResult> {
    const orderLineItems = params.lineItems.map(li => ({
      name: li.name,
      quantity: String(li.quantity),
      base_price_money: {
        amount: li.unitAmountCents,
        currency: 'USD',
      },
    }))

    const res = await this.squareRequest('/v2/online-checkout/payment-links', {
      method: 'POST',
      body: JSON.stringify({
        idempotency_key: this.generateIdempotencyKey(),
        order: {
          location_id: this.locationId,
          line_items: orderLineItems,
          metadata: { orderId: params.orderId },
        },
        checkout_options: {
          redirect_url: `${params.origin}/order/success?session_id=sq_${params.orderId}`,
        },
      }),
    })

    const data = await res.json() as {
      payment_link?: { id: string; url: string }
      errors?: Array<{ detail: string }>
    }

    if (!res.ok || !data.payment_link) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to create Square checkout link')
    }

    return {
      checkoutUrl: data.payment_link.url,
      providerSessionId: data.payment_link.id,
    }
  }

  async createTerminalPayment(params: CreateTerminalPaymentParams): Promise<TerminalPaymentResult> {
    const res = await this.squareRequest('/v2/terminals/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        idempotency_key: this.generateIdempotencyKey(),
        checkout: {
          amount_money: {
            amount: params.totalCents,
            currency: 'USD',
          },
          reference_id: params.orderId,
          device_options: {
            device_id: 'default',
          },
          payment_type: 'CARD_PRESENT',
        },
      }),
    })

    const data = await res.json() as {
      checkout?: { id: string; payment_ids?: string[] }
      errors?: Array<{ detail: string }>
    }

    if (!res.ok || !data.checkout) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to create Square terminal checkout')
    }

    return {
      terminalPaymentId: data.checkout.id,
      providerPaymentId: data.checkout.payment_ids?.[0] || data.checkout.id,
    }
  }

  async getTerminalPaymentStatus(terminalPaymentId: string): Promise<TerminalPaymentStatus> {
    const res = await this.squareRequest(`/v2/terminals/checkouts/${terminalPaymentId}`)

    const data = await res.json() as {
      checkout?: { id: string; status: string; payment_ids?: string[] }
      errors?: Array<{ detail: string }>
    }

    if (!res.ok || !data.checkout) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to get terminal status')
    }

    const statusMap: Record<string, TerminalPaymentStatus['status']> = {
      PENDING: 'pending',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      CANCEL_REQUESTED: 'cancelled',
    }

    return {
      status: statusMap[data.checkout.status] || 'pending',
      providerPaymentId: data.checkout.payment_ids?.[0],
    }
  }

  async cancelTerminalPayment(terminalPaymentId: string): Promise<void> {
    const res = await this.squareRequest(`/v2/terminals/checkouts/${terminalPaymentId}/cancel`, {
      method: 'POST',
    })

    if (!res.ok) {
      const data = await res.json() as { errors?: Array<{ detail: string }> }
      throw new Error(data.errors?.[0]?.detail || 'Failed to cancel terminal payment')
    }
  }

  async validateWebhook(request: Request): Promise<WebhookValidationResult> {
    const signature = request.headers.get('x-square-hmacsha256-signature')
    if (!signature || !this.webhookSignatureKey) {
      return { valid: false, events: [] }
    }

    const body = await request.text()
    const url = request.url

    // HMAC-SHA256 verification
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.webhookSignatureKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(url + body))
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))

    if (computedSignature !== signature) {
      return { valid: false, events: [] }
    }

    const payload = JSON.parse(body) as {
      type?: string
      data?: {
        object?: {
          payment?: {
            id: string
            reference_id?: string
            status?: string
            buyer_email_address?: string
          }
        }
      }
    }

    const events: WebhookValidationResult['events'] = []

    if (payload.type === 'payment.updated') {
      const payment = payload.data?.object?.payment
      if (payment?.status === 'COMPLETED' && payment.reference_id) {
        events.push({
          type: 'payment_completed',
          orderId: payment.reference_id,
          providerPaymentId: payment.id,
          customerEmail: payment.buyer_email_address || undefined,
        })
      }
    }

    return { valid: true, events }
  }

  getPublicConfig(): Record<string, string> {
    return {
      provider: 'square',
      applicationId: this.applicationId,
      locationId: this.locationId,
      environment: this.environment,
    }
  }
}
