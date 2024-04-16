import { CoreUtil, WalletData } from '@bchouse/cashconnect'
import { SignClient } from '@walletconnect/sign-client/dist/types/client'
import { SessionTypes } from '@walletconnect/types/dist/types/sign-client/session'
import { createMachine } from 'xstate'
import { getSignClient } from '../utils/wc2.client'

type Event =
  | {
      type: 'wallet_selected'
      wallet: WalletData
    }
  | {
      type: 'error'
    }
  | {
      type: 'uri_set'
      uri: string
      approval: () => Promise<SessionTypes.Struct>
    }
  | {
      type: 'details_confirmed'
    }
  | {
      type: 'complete'
    }
  | {
      type: 'back'
    }
  | {
      type: 'wallet_connected'
      session: SessionTypes.Struct
    }
  | {
      type: 'wallet_connected_timeout'
    }

type Context = {
  isLoggedIn: boolean
  signClient: SignClient
  wallet?: WalletData
  uri?: string
  refundAddress?: string
  session: SessionTypes.Struct | null
  approval?: () => Promise<SessionTypes.Struct>
}

export const connectModalMachine = createMachine(
  {
    id: 'connect-modal',
    context: {} as Context,
    schema: {
      events: {} as Event,
    },
    initial: 'initial',
    tsTypes: {} as import('./modal.machine.typegen').Typegen0,
    predictableActionArguments: true,
    states: {
      initial: {
        always: [
          {
            target: 'fetch_payment_request',
            cond: (context) => !context.session,
          },
          {
            //TODO: Session already created view
            // Allow to destroy or continue
            target: 'completed',
            cond: (context) => !!context.session,
          },
        ],
      },
      fetch_payment_request: {
        invoke: {
          id: 'fetch_payment_request',
          // This uses the invoked callback syntax - my favourite
          // syntax for expressing services
          src: (context, event) => async (send) => {
            //TODO: use cache if not paid/invalidated and same params
            const { uri, approval } = await getSignClient()

            if (!uri) {
              //TODO: show error
            } else {
              send({
                type: 'uri_set',
                uri,
                approval,
              })
            }
          },
        },
        on: {
          uri_set: {
            target: 'payment_qr',
            actions: 'assignUri',
          },
          back: {
            target: 'confirm_details',
            actions: 'clearUri',
          },
        },
      },
      payment_qr: {
        on: {
          wallet_selected: [
            {
              target: 'wallet_connecting',
              actions: 'assignSelectedWallet',
            },
          ],
        },
      },
      wallet_connecting: {
        invoke: {
          id: 'wallet_approval',
          src: (context, event) => async (send) => {
            if (!context.wallet) return
            const { desktop } = context.wallet
            const url = await CoreUtil.getWalletValue(
              desktop?.universal,
              context.uri
            )

            if (!url) return
            CoreUtil.openHref(url, '_blank')

            if (!context.approval) {
              send({ type: 'back' })
            } else {
              const session = await context.approval()

              await context.signClient.session.update(session.topic, {
                sessionConfig: {
                  ...(session.sessionConfig || {}),
                  disableDeepLink: true,
                },
              })

              //TODO: Use associated wallet and check for disableDeepLink
              const config = session.sessionConfig
              session.sessionConfig = { ...config, disableDeepLink: true }

              send({
                type: 'wallet_connected',
                session,
              })
            }
          },
        },
        on: {
          wallet_connected: [
            {
              target: 'completed',
              actions: ['assignSession', 'setSession'],
            },
          ],
          wallet_connected_timeout: [
            {
              target: 'fetch_payment_request',
              actions: ['clearSession', 'clearWallet'],
            },
          ],
        },
      },
      confirm_details: {
        on: {
          details_confirmed: [
            {
              target: 'completed',
            },
          ],
          back: {
            target: 'payment_qr',
            actions: 'clearWallet',
          },
        },
      },
      completed: {
        type: 'final',
      },
    },
  },
  {
    actions: {
      assignSelectedWallet: (context, event) => {
        context.wallet = event.wallet
      },
      clearWallet: (context, event) => {
        context.wallet = undefined
      },
      assignUri: (context, event) => {
        context.uri = event.uri
        context.approval = event.approval
      },
      clearUri: (context) => {
        context.uri = undefined
      },
      assignSession: (context, event) => {
        context.session = event.session
      },
      clearSession: (context, event) => {
        context.session = null
      },
    },
  }
)
