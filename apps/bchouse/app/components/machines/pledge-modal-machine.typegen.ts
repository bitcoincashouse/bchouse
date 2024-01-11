// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true
  internalEvents: {
    'xstate.init': { type: 'xstate.init' }
  }
  invokeSrcNameMap: {}
  missingImplementations: {
    actions: 'onClose'
    delays: never
    guards: never
    services: never
  }
  eventsCausingActions: {
    assignAmount: 'amount_selected'
    assignAnyonecanpayPayload: 'anyonecanpay_confirmed'
    assignMessage: 'anyonecanpay_message'
    assignPaymentRequest: 'payment_requested'
    assignRefundAddress: 'refund_address_selected'
    assignSelectedWallet: 'wallet_selected'
    clearAmount: 'back'
    clearMessage: 'back'
    clearPaymentRequest: 'back'
    clearRefundAddress: 'back'
    clearWallet: 'back'
    onClose: 'back' | 'pledge_submitted'
  }
  eventsCausingDelays: {}
  eventsCausingGuards: {}
  eventsCausingServices: {
    fetch_payment_request: 'details_confirmed'
    submit_anyonecanpay_pledge: 'anyonecanpay_confirmed'
  }
  matchesStates:
    | 'anyonecanpay_message'
    | 'anyonecanpay_payload'
    | 'anyonecanpay_submit'
    | 'choose_amount'
    | 'choose_refund_address'
    | 'choose_wallet'
    | 'completed'
    | 'confirm_details'
    | 'donation'
    | 'fetch_payment_request'
    | 'initial'
    | 'leave_message'
    | 'payment_qr'
  tags: never
}
