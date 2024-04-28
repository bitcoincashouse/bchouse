import SignClient from '@walletconnect/sign-client'
import { SessionTypes } from '@walletconnect/types'

export async function getUserAddress(
  signClient: SignClient,
  session: SessionTypes.Struct
) {
  const result = (await signClient
    .request({
      chainId: 'bch:bitcoincash',
      topic: session.topic,
      request: {
        method: 'bch_getAddresses',
        params: {},
      },
    })
    .catch((err) => {
      console.log(err)
      return []
    })) as string[]

  return result[0]
}

export async function getUserSignature(
  signClient: SignClient,
  session: SessionTypes.Struct,
  account: string,
  message: string
) {
  const result = (await signClient
    .request({
      chainId: 'bch:bitcoincash',
      topic: session.topic,
      request: {
        method: 'bch_signMessage',
        params: {
          account,
          message,
        },
      },
    })
    .catch((err) => {
      console.log(err)
      return []
    })) as string[]

  console.log(result)

  return result[0]
}
