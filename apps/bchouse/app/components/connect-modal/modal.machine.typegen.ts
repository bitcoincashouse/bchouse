// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true
  internalEvents: {
    '': { type: '' }
    'xstate.init': { type: 'xstate.init' }
  }
  invokeSrcNameMap: {}
  missingImplementations: {
    actions: 'setSession'
    delays: never
    guards: never
    services: never
  }
  eventsCausingActions: {
    assignSelectedWallet: 'wallet_selected'
    assignSession: 'wallet_connected'
    assignUri: 'uri_set'
    clearSession: 'wallet_connected_timeout'
    clearUri: 'back'
    clearWallet: 'back' | 'wallet_connected_timeout'
    setSession: 'wallet_connected'
  }
  eventsCausingDelays: {}
  eventsCausingGuards: {}
  eventsCausingServices: {
    fetch_payment_request: '' | 'wallet_connected_timeout'
    wallet_approval: 'wallet_selected'
  }
  matchesStates:
    | 'completed'
    | 'confirm_details'
    | 'fetch_payment_request'
    | 'initial'
    | 'payment_qr'
    | 'wallet_connecting'
  tags: never
}
