export interface CreateOnlineCheckoutParams {
  lineItems: ProviderLineItem[]
  totalCents: number
  orderId: string
  origin: string
}

export interface OnlineCheckoutResult {
  clientSecret?: string
  checkoutUrl?: string
  providerSessionId: string
}

export interface CreatePosPaymentParams {
  lineItems: ProviderLineItem[]
  totalCents: number
  orderId: string
  sourceId?: string // Square: tokenized card nonce from frontend
}

export interface PosPaymentResult {
  clientSecret?: string
  providerPaymentId: string
}

export interface CreatePosCheckoutLinkParams {
  lineItems: ProviderLineItem[]
  totalCents: number
  orderId: string
  origin: string
}

export interface PosCheckoutLinkResult {
  checkoutUrl: string
  providerSessionId: string
}

export interface CreateTerminalPaymentParams {
  lineItems: ProviderLineItem[]
  totalCents: number
  orderId: string
}

export interface TerminalPaymentResult {
  terminalPaymentId: string
  providerPaymentId: string
  clientSecret?: string
}

export interface TerminalPaymentStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'error'
  providerPaymentId?: string
}

export interface WebhookEvent {
  type: 'payment_completed'
  orderId: string
  providerPaymentId: string
  customerName?: string
  customerEmail?: string
}

export interface WebhookValidationResult {
  valid: boolean
  events: WebhookEvent[]
}

export interface ProviderLineItem {
  name: string
  unitAmountCents: number
  quantity: number
}

export interface PaymentProvider {
  readonly name: 'stripe' | 'square'

  createOnlineCheckout(params: CreateOnlineCheckoutParams): Promise<OnlineCheckoutResult>
  createPosPayment(params: CreatePosPaymentParams): Promise<PosPaymentResult>
  createPosCheckoutLink(params: CreatePosCheckoutLinkParams): Promise<PosCheckoutLinkResult>
  createTerminalPayment(params: CreateTerminalPaymentParams): Promise<TerminalPaymentResult>
  getTerminalPaymentStatus(terminalPaymentId: string): Promise<TerminalPaymentStatus>
  cancelTerminalPayment(terminalPaymentId: string): Promise<void>
  createTerminalConnectionToken?(): Promise<{ secret: string }>
  validateWebhook(request: Request): Promise<WebhookValidationResult>
  getPublicConfig(): Record<string, string>
}
