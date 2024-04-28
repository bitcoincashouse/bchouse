import {
  CompletePledgeView,
  Content,
  // MobileConnectingView,
  DesktopConnectingView,
  PlainQrCodeView,
  Spinner,
  WalletData,
  WalletProtocol,
  WalletSection,
} from '@bchouse/cashconnect'
import { SignClient } from '@walletconnect/sign-client/dist/types/client'
import { SessionTypes } from '@walletconnect/types/dist/types/sign-client/session'
import { useMachine } from '@xstate/react'
import { useMemo } from 'react'
import { bchLogo } from '~/utils/constants'
import { StepRoute } from '../../StepRoutes/step'
import { connectModalMachine } from '../modal.machine'

export function ConnectModalRoutes({
  isLoggedIn,
  onClose,
  session,
  setSession,
  signClient,
}: {
  isLoggedIn: boolean
  signClient: SignClient
  session: SessionTypes.Struct | null
  setSession: (context: {
    session: SessionTypes.Struct | null
    address: string | null
  }) => void
  onClose: () => void | Promise<void>
}) {
  const [state, send] = useMachine(connectModalMachine, {
    context: {
      isLoggedIn,
      session,
      signClient,
    },
    actions: {
      setSession,
    },
  })

  const protocols = useMemo(() => {
    return ['wc2'] as WalletProtocol[]
  }, [])

  let route

  if (state.matches('fetch_payment_request') || state.matches('payment_qr')) {
    route = (
      <PlainQrCodeView
        title={'Scan to connect'}
        uri={state.context.uri as string}
        imageAlt="Donation address QR"
        imageUrl={bchLogo}
        footer={
          state.context.uri ? (
            <WalletSection
              onSelect={async (wallet) => {
                send({
                  type: 'wallet_selected',
                  wallet,
                })
              }}
              network={'mainnet'}
              protocols={protocols}
            />
          ) : null
        }
      />
    )
  } else if (state.matches('wallet_connecting')) {
    route = (
      <DesktopConnectingView
        uri={state.context.uri as string}
        wallet={state.context.wallet as WalletData}
        showBackBtn={true}
        onGoBack={() => send('back')}
      />
    )
  } else if (state.matches('completed')) {
    //TODO: add both exit and forward contract download (forward must wait for event which requires another subscription or second event)
    route = (
      //TODO: remove pledge view
      <CompletePledgeView refundUrl={`/campaign/pledge/refund/`} />
    )
  } else {
    route = (
      <div className="wcm-walletconnect-qr">
        <Content>
          <div className="wcm-qr-container">
            <Spinner className="flex justify-center" />
          </div>
        </Content>
      </div>
    )
  }

  const step =
    state.value === 'fetch_payment_request'
      ? 'payment_qr'
      : (state.value as string)

  return <StepRoute step={step}>{route}</StepRoute>
}
