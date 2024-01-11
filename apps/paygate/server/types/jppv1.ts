/**
 * Response for the Payment Protocol 'application/payment-option'.
 * These are the supported payment options to the v1 Payment Protocol.
 */

/**
 * Response for the Payment Protocol 'application/payment-request'.
 * This tells us how to fulfill a Payment Protocol invoice: Payment address, network
 * fee requirements, etc.
 */

export interface PaymentProtoOutput {
  amount: number
  address: string
}

export interface PaymentProtoInvoiceResponse {
  network: string
  currency: string
  requiredFeePerByte: number
  outputs: PaymentProtoOutput[]
  time: Date
  expires: Date
  memo: string
  paymentUrl: string
  paymentId: string
}

/**
 * Response format for the JSON Payment Protocol 'application/payment-verification'.
 * This tells us whether the Payment Protocol thinks our tx is valid, ensuring our broadcast
 * will be accepted by them.
 */

export interface PaymentProtoTransaction {
  tx: string
}

export interface PaymentProtoVerificationPayment {
  transactions: PaymentProtoTransaction[]
}

export interface PaymentProtoVerificationResponse {
  payment: PaymentProtoVerificationPayment
  memo: string
}
