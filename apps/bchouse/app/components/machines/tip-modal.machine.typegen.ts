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
    assignPaymentRequest: 'payment_requested'
    assignSelectedWallet: 'wallet_selected'
    clearAmount: 'back'
    clearPaymentRequest: 'back'
    clearWallet: 'back'
    onClose: 'tip_deposited'
  }
  eventsCausingDelays: {}
  eventsCausingGuards: {}
  eventsCausingServices: {
    fetch_payment_request: 'details_confirmed'
  }
  matchesStates:
    | 'choose_amount'
    | 'choose_wallet'
    | 'confirm_details'
    | 'fetch_payment_request'
    | 'payment_qr'
    | 'unsupported_wallet'
  tags: never
}
