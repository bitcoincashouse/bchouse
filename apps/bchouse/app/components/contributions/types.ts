export type Contribution = {
  pledgeRequestId: string
  createdAt: string
  satoshis: bigint
  username: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  anonymousName: string | null
}
