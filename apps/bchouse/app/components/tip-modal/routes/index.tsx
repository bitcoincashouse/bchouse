import {
  ChooseAmountView,
  ConfirmDetailsView,
  ConnectWalletView,
  InfoFooter,
  PlainQrCodeView,
  WCText,
  WalletData,
} from '@bchouse/cashconnect'
import { Network, prettyPrintSats } from '@bchouse/utils'
import { useRevalidator } from '@remix-run/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { bchLogo, checkmarkIcon } from '~/utils/constants'
import { useTipRequestSubscription } from '~/utils/useTipRequestSubscription'
import { StepRoute } from '../../StepRoutes/step'
import { usePersistedTipMachine } from '../provider'

export function TipPostModalRoutes({
  postId,
  network,
  onClose,
  authorDisplayName,
}: {
  network: Network
  postId: string
  authorDisplayName: string
  isLoggedIn: boolean
  onClose: () => void | Promise<void>
}) {
  const [state, send] = usePersistedTipMachine(onClose)

  let route

  if (state.matches('choose_wallet')) {
    //TODO: Allow user to choose a wallet to connect if they have no history
    //Otherwise, allow the user to choose a previous address or move on to connect a wallet.
    route = (
      <ConnectWalletView
        protocols={['bip70', 'jpp', 'jppv2', 'wc2']}
        onSelectWallet={(wallet) =>
          send({
            type: 'wallet_selected',
            wallet,
          })
        }
        title="Connect a wallet"
        network={network}
        footer={
          <InfoFooter className="text-center">
            <button
              type="button"
              onClick={() => {
                send({ type: 'unsupported_wallet_selected' })
              }}
            >
              <WCText variant="small-regular" color="accent">
                Proceed with an unsupported wallet?
              </WCText>
            </button>
          </InfoFooter>
        }
      />
    )
  }
  if (state.matches('unsupported_wallet')) {
    //TODO: Allow user to choose a wallet to connect if they have no history
    //Otherwise, allow the user to choose a previous address or move on to connect a wallet.
    route = (
      <PlainQrCodeView
        title={
          <>
            Unsupported Tip to{' '}
            <span className="whitespace-nowrap">{authorDisplayName}</span>
          </>
        }
        uri={state.context.bchAddress}
        imageAlt="Tip address QR"
        imageUrl={bchLogo}
        onGoBack={() => send('back')}
        showBackBtn
        footer={
          <>
            <AddressFooter address={state.context.bchAddress} />
            <InfoFooter className="text-center">
              <WCText variant="small-regular">
                <a
                  href={state.context.bchAddress}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  Open
                </a>{' '}
                your default wallet. Manually close the modal after tipping.
              </WCText>
            </InfoFooter>
          </>
        }
      />
    )
  } else if (state.matches('choose_amount')) {
    route = (
      <ChooseAmountView
        title="Enter a tip amount"
        showBackBtn={true}
        onGoBack={() => send('back')}
        onAmountSelected={(amount) =>
          send({
            type: 'amount_selected',
            amount,
          })
        }
      />
    )
  } else if (state.matches('confirm_details')) {
    const [amount, denomination] = prettyPrintSats(
      state.context.amount as number
    )

    route = (
      <ConfirmDetailsView
        title="Confirm tip details"
        showBackBtn={true}
        onGoBack={() => send('back')}
        onNext={() =>
          send({
            type: 'details_confirmed',
          })
        }
        wallet={state.context.wallet as WalletData}
        amount={amount + denomination}
      />
    )
  } else if (
    state.matches('payment_qr') ||
    state.matches('fetch_payment_request')
  ) {
    route = (
      <PaymentView
        requestId={state.context.requestId}
        paymentUrl={state.context.paymentUrl}
        address={state.context.bchAddress}
        displayName={authorDisplayName}
        onGoBack={() => send('back')}
        nextStep={() => {
          send({
            type: 'tip_deposited',
          })
        }}
      />
    )
  }

  return <StepRoute step={state.value as string}>{route}</StepRoute>
}

function PaymentView({
  nextStep,
  requestId,
  paymentUrl,
  address,
  displayName,
  onGoBack,
}: {
  requestId?: string
  paymentUrl?: string
  address?: string
  displayName?: string
  nextStep: () => void
  onGoBack: () => void
}) {
  const revalidator = useRevalidator()
  const paymentStatus = useTipRequestSubscription(requestId)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (paymentStatus === 'success') {
      revalidator.revalidate()
      queryClient.invalidateQueries({ queryKey: ['feed'] })

      if (document.visibilityState === 'visible') {
        const timeoutId = setTimeout(() => nextStep(), 2000)

        return () => clearTimeout(timeoutId)
      } else {
        //Handle refocus
        const handleFocus = () => setTimeout(() => nextStep(), 2000)

        if (typeof window !== 'undefined' && window.addEventListener) {
          window.addEventListener('visibilitychange', handleFocus, false)
          window.addEventListener('focus', handleFocus, false)
        }

        return () => {
          // Be sure to unsubscribe if a new handler is set
          window.removeEventListener('visibilitychange', handleFocus)
          window.removeEventListener('focus', handleFocus)
        }
      }
    }

    return
  }, [paymentStatus])

  const title =
    paymentStatus === 'error' ? (
      'Tip failed'
    ) : paymentStatus === 'success' ? (
      'Tip sent'
    ) : (
      <>
        Tip to <span className="whitespace-nowrap">{displayName}</span>
      </>
    )

  return (
    <PlainQrCodeView
      title={title}
      uri={paymentUrl}
      imageAlt="Tip address QR"
      imageUrl={paymentStatus === 'success' ? checkmarkIcon : bchLogo}
      onGoBack={onGoBack}
      showBackBtn
      footer={<AddressFooter address={address} />}
    />
  )
}

function AddressFooter({ address }: { address?: string | null }) {
  return address ? (
    <div className="pb-5 px-4">
      <WCText variant="small-regular" className="truncate" color="accent">
        <a
          href={'https://bch.loping.net/address/' + address}
          target="_blank"
          rel="noopener nofollow"
        >
          {address}
        </a>
      </WCText>
    </div>
  ) : null
}
