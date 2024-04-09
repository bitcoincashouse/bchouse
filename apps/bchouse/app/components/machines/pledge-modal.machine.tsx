import { WalletData } from '@bchouse/cashconnect'
import { createMachine } from 'xstate'
import {
  clearPaymentRequestQuery,
  queryPaymentRequest,
} from '~/utils/usePledgePaymentRequest'

type Event =
  | {
      type: 'wallet_selected'
      wallet: WalletData
    }
  | {
      type: 'anyonecanpay_message'
      comment?: string
      name?: string
    }
  | {
      type: 'anyonecanpay_confirmed'
      payload: string
    }
  | {
      type: 'error'
    }
  | {
      type: 'pledge_submitted'
    }
  | {
      type: 'donate_selected'
    }
  | {
      type: 'amount_selected'
      amount: number
    }
  | {
      type: 'refund_address_selected'
      refundAddress: string
    }
  | {
      type: 'details_confirmed'
    }
  | {
      type: 'payment_requested'
      requestId: string
      paymentUrl: string
      secret: string
    }
  | {
      type: 'pledge_deposited'
    }
  | {
      type: 'complete'
    }
  | {
      type: 'back'
    }

type Context = {
  campaignId: string
  isLoggedIn: boolean
  donationAddress: string
  wallet?: WalletData
  amount?: number
  refundAddress?: string
  requestId?: string
  paymentUrl?: string
  secret?: string
  anyonecanpayPayload?: string
  name?: string
  comment?: string
}

export const pledgeModalMachine = createMachine(
  {
    id: 'pledge-modal',
    context: {} as Context,
    schema: {
      events: {} as Event,
    },
    initial: 'initial',
    tsTypes: {} as import('./pledge-modal.machine.typegen').Typegen0,
    predictableActionArguments: true,
    states: {
      initial: {
        always: [
          {
            target: 'choose_wallet',
            cond: (context) => context.isLoggedIn,
          },
          {
            target: 'donation',
            cond: (context) => !context.isLoggedIn,
          },
        ],
      },
      choose_wallet: {
        on: {
          wallet_selected: [
            {
              target: 'choose_amount',
              actions: 'assignSelectedWallet',
            },
          ],
          donate_selected: {
            target: 'donation',
          },
        },
      },
      anyonecanpay_message: {
        on: {
          anyonecanpay_message: {
            target: 'anyonecanpay_payload',
            actions: 'assignMessage',
          },
          back: {
            target: 'choose_amount',
            actions: 'clearAmount',
          },
        },
      },
      anyonecanpay_payload: {
        on: {
          anyonecanpay_confirmed: {
            target: 'anyonecanpay_submit',
            actions: 'assignAnyonecanpayPayload',
          },
          back: {
            target: 'anyonecanpay_message',
            actions: 'clearMessage',
          },
        },
      },
      anyonecanpay_submit: {
        invoke: {
          id: 'submit_anyonecanpay_pledge',
          // This uses the invoked callback syntax - my favourite
          // syntax for expressing services
          src: (context, event) => async (send) => {
            //submit annyonecanpay pledge, show loader until done, then leave message
            const result = await window.trpcClient.submitAnyonecanpay.mutate({
              campaignId: context.campaignId as string,
              payload: context.anyonecanpayPayload as string,
            })

            if (result instanceof Error) {
              send({
                type: 'error',
              })
            } else {
              send({
                type: 'pledge_submitted',
              })
            }
          },
        },
        on: {
          error: {
            target: 'anyonecanpay_payload',
          },
          pledge_submitted: {
            actions: 'onClose',
          },
        },
      },
      donation: {
        on: {
          back: [
            {
              target: 'choose_wallet',
              actions: 'clearWallet',
              cond: (context) => context.isLoggedIn,
            },
            {
              actions: 'onClose',
              cond: (context) => !context.isLoggedIn,
            },
          ],
        },
      },
      choose_amount: {
        on: {
          amount_selected: [
            {
              target: 'choose_refund_address',
              actions: 'assignAmount',
              cond: (context) => context.wallet?.id !== 'flipstarter_plugin',
            },
            {
              target: 'anyonecanpay_message',
              actions: 'assignAmount',
              cond: (context) => context.wallet?.id === 'flipstarter_plugin',
            },
          ],
          back: {
            target: 'choose_wallet',
            actions: 'clearWallet',
          },
        },
      },
      choose_refund_address: {
        on: {
          refund_address_selected: {
            target: 'confirm_details',
            actions: 'assignRefundAddress',
          },
          back: {
            target: 'choose_amount',
            actions: 'clearAmount',
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
            target: 'choose_refund_address',
            actions: 'clearRefundAddress',
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
            const { paymentUrl, requestId, secret } = await queryPaymentRequest(
              {
                address: context.refundAddress as string,
                amount: context.amount as number,
                campaignId: context.campaignId as string,
              }
            )

            send({
              type: 'payment_requested',
              requestId,
              paymentUrl,
              secret,
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
          pledge_deposited: {
            target: 'leave_message',
            actions: (context) => {
              clearPaymentRequestQuery({
                address: context.refundAddress as string,
                amount: context.amount as number,
                campaignId: context.campaignId as string,
              })
            },
          },
          back: {
            target: 'confirm_details',
            actions: 'clearPaymentRequest',
          },
        },
      },
      leave_message: {
        on: {
          complete: {
            target: 'completed',
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
      assignAmount: (context, event) => {
        context.amount = event.amount
      },
      clearAmount: (context, event) => {
        context.amount = undefined
      },
      assignRefundAddress: (context, event) => {
        context.refundAddress = event.refundAddress
      },
      clearRefundAddress: (context, event) => {
        context.refundAddress = undefined
      },
      assignPaymentRequest: (context, event) => {
        context.paymentUrl = event.paymentUrl
        context.requestId = event.requestId
        context.secret = event.secret
      },
      clearPaymentRequest: (context) => {
        context.paymentUrl = undefined
        context.requestId = undefined
      },
      assignMessage: (context, event) => {
        context.name = event.name
        context.comment = event.comment
      },
      clearMessage: (context) => {
        context.name = undefined
        context.comment = undefined
      },
      assignAnyonecanpayPayload: (context, event) => {
        context.anyonecanpayPayload = event.payload
      },
    },
  }
)
