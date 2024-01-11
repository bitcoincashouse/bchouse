import type { ColumnType } from 'kysely'
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export const Network = {
  mainnet: 'mainnet',
  testnet3: 'testnet3',
  testnet4: 'testnet4',
  chipnet: 'chipnet',
  regtest: 'regtest',
} as const
export type Network = (typeof Network)[keyof typeof Network]
export type Invoice = {
  id: Generated<string>
  network: Network
  amount: bigint
  address: string
  memo: string | null
  event: unknown
  createdAt: Generated<Timestamp>
  version: number
}
export type InvoicePayment = {
  invoiceId: string
  txid: string
  vout: number
  paidAt: Generated<Timestamp>
}
export type DB = {
  Invoice: Invoice
  InvoicePayment: InvoicePayment
}
