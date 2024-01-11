import { WalletData } from '@bchouse/cashconnect'
import { createMachine } from 'xstate'
import {
  clearTipPaymentRequestQuery,
  queryTipPaymentRequest,
} from '~/routes/api.payment-request.tip'

type Event =
  | {
      type: 'unsupported_wallet_selected'
    }
  | {
      type: 'wallet_selected'
      wallet: WalletData
    }
  | {
      type: 'amount_selected'
      amount: number
    }
  | {
      type: 'details_confirmed'
    }
  | {
      type: 'payment_requested'
      requestId: string
      paymentUrl: string
    }
  | {
      type: 'tip_deposited'
    }
  | {
      type: 'back'
    }

type Context = {
  postId: string
  bchAddress: string
  wallet?: WalletData
  amount?: number
  requestId?: string
  paymentUrl?: string
}

export const tipPostModalMachine = createMachine(
  {
    id: 'tip-modal',
    context: {} as Context,
    schema: {
      events: {} as Event,
    },
    initial: 'choose_wallet',
    tsTypes: {} as import('./tip-modal-machine.typegen').Typegen0,
    predictableActionArguments: true,
    states: {
      choose_wallet: {
        on: {
          wallet_selected: [
            {
              target: 'choose_amount',
              actions: 'assignSelectedWallet',
            },
          ],
          unsupported_wallet_selected: {
            target: 'unsupported_wallet',
          },
        },
      },
      unsupported_wallet: {
        on: {
          back: {
            target: 'choose_wallet',
          },
        },
      },
      choose_amount: {
        on: {
          amount_selected: {
            target: 'confirm_details',
            actions: 'assignAmount',
          },
          back: {
            target: 'choose_wallet',
            actions: 'clearWallet',
          },
        },
      },
      confirm_details: {
        on: {
          details_confirmed: [
            {
              target: 'fetch_payment_request',
            },
          ],
          back: {
            target: 'choose_amount',
            actions: 'clearAmount',
          },
        },
      },
      fetch_payment_request: {
        invoke: {
          id: 'fetch_payment_request',
          // This uses the invoked callback syntax - my favourite
          // syntax for expressing services
          src: (context, event) => async (send) => {
            //TODO: use cache if not paid/invalidated and same params
            const { paymentUrl, requestId } = await queryTipPaymentRequest({
              amount: context.amount as number,
              postId: context.postId as string,
            })

            send({
              type: 'payment_requested',
              requestId,
              paymentUrl,
            })
          },
        },
        on: {
          payment_requested: {
            target: 'payment_qr',
            actions: 'assignPaymentRequest',
          },
          back: {
            target: 'confirm_details',
            actions: 'clearPaymentRequest',
          },
        },
      },
      payment_qr: {
        on: {
          tip_deposited: {
            actions: [
              (context) => {
                clearTipPaymentRequestQuery({
                  amount: context.amount as number,
                  postId: context.postId as string,
                })
              },
              'onClose',
            ],
          },
          back: {
            target: 'confirm_details',
            actions: 'clearPaymentRequest',
          },
        },
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
      assignAmount: (context, event) => {
        context.amount = event.amount
      },
      clearAmount: (context, event) => {
        context.amount = 0
      },
      assignPaymentRequest: (context, event) => {
        context.paymentUrl = event.paymentUrl
        context.requestId = event.requestId
      },
      clearPaymentRequest: (context) => {
        context.paymentUrl = undefined
        context.requestId = undefined
      },
    },
  }
)
