export type PaymentOptions = {
  memo?: string | null
  paymentId: string
  paymentUrl: string
  merchantData: Object
}

export type HandleSuccessFn = (
  txId: string,
  vout: number,
  txHex: string
) => Promise<string> | string
