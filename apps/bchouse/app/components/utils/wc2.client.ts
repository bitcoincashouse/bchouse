import SignClient from '@walletconnect/sign-client'
import { SessionTypes } from '@walletconnect/types'

const chain =
  typeof window !== 'undefined' && window.env.BCH_NETWORK !== 'mainnet'
    ? 'bch:bchtest'
    : 'bch:bitcoincash'

export const signClient = await SignClient.init({
  projectId: window.env.WALLET_CONNECT_PROJECT_ID,
  relayUrl: 'wss://relay.walletconnect.com',
  metadata: {
    name: 'BCHouse',
    description: 'BCHouse is social media for BCH',
    url: 'https://bchouse.app',
    icons: ['https://bchouse.app/assets/images/bchouse.svg'],
  },
})

export async function getUserAddress(session: SessionTypes.Struct) {
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

signClient.on('proposal_expire', ({ id }) => {})
signClient.on('session_authenticate', ({ id, topic }) => {})
signClient.on('session_delete', ({ id, topic }) => {})
signClient.on('session_event', ({ id, topic, params }) => {})
signClient.on('session_expire', ({ topic }) => {})
signClient.on('session_extend', ({ id, topic }) => {})
signClient.on('session_ping', ({ id, topic }) => {})
signClient.on('session_proposal', ({ id, params, verifyContext }) => {})
signClient.on('session_request', ({ id, params, topic, verifyContext }) => {})
signClient.on('session_request_expire', ({ id }) => {})
signClient.on('session_update', ({ id, topic, params }) => {})
signClient.on('session_request_sent', ({ chainId, id, request, topic }) => {})

export async function getSignClient() {
  return await signClient.connect({
    requiredNamespaces: {
      bch: {
        chains: ['bch:bitcoincash'],
        methods: ['bch_getAddresses', 'bch_signTransaction', 'bch_signMessage'],
        events: ['addressesChanged'],
      },
    },
  })
}
