import {
  ChoosePledgeAmountView,
  CompletePledgeView,
  ConfirmDetailsView,
  ConnectWalletView,
  Content,
  InfoFooter,
  ManualAddressView,
  MessageView,
  PlainQrCodeView,
  Spinner,
  WCText,
  WalletData,
  WalletProtocol,
} from '@bchouse/cashconnect'
import { Network, formatAddress, prettyPrintSats } from '@bchouse/utils'
import { Link } from '@remix-run/react'
import { useMemo } from 'react'
import { bchLogo } from '~/utils/constants'
import { StepRoute } from '../../StepRoutes/step'
import { usePersistedPledgeMachine } from '../provider'
import { AnyonecanpayView } from './anyonecanpay-view'
import { LeaveMessageView } from './leave-message-view'
import { PaymentView } from './payment-view'

export function PledgeFundraiserModalRoutes({
  goal,
  minimum,
  isLoggedIn,
  onClose,
  campaign,
}: {
  campaign: {
    id: string
    expires: number
    recipients: {
      address: string
      satoshis: number
    }[]
    raised: number
    network: Network
    campaigner: {
      fullName: string
    }
    version: number
  }
  goal: number
  minimum: number
  isLoggedIn: boolean
  onClose: () => void | Promise<void>
}) {
  const [state, send] = usePersistedPledgeMachine(isLoggedIn, onClose)
  const protocols = useMemo(() => {
    const supported = ['bip70', 'jpp', 'jppv2', 'wc2'] as WalletProtocol[]

    if (campaign.version >= 2) {
      supported.push('fs_plugin' as any)
    }

    return supported
  }, [campaign.version])

  let route

  if (state.matches('choose_wallet')) {
    //TODO: Allow user to choose a wallet to connect if they have no history
    //Otherwise, allow the user to choose a previous address or move on to connect a wallet.
    route = (
      <ConnectWalletView
        protocols={protocols}
        onSelectWallet={(wallet) =>
          send({
            type: 'wallet_selected',
            wallet,
          })
        }
        title="Connect a wallet"
        network={campaign.network}
        footer={
          <InfoFooter className="text-center">
            <button
              type="button"
              onClick={() => {
                send({ type: 'donate_selected' })
              }}
            >
              <WCText variant="small-regular" color="accent">
                Donate instead and skip the setup?
              </WCText>
              <WCText variant="small-regular" color="secondary">
                Supports all BitcoinCash wallets
              </WCText>
            </button>
          </InfoFooter>
        }
      />
    )
  } else if (state.matches('donation')) {
    route = (
      <PlainQrCodeView
        title={
          <div>
            <span>
              Donation to{' '}
              <span className="whitespace-nowrap">
                {campaign.campaigner.fullName}
              </span>{' '}
              Campaign
            </span>
          </div>
        }
        subtitle={
          <WCText
            className="text-center -mt-3 pb-4"
            variant="xsmall-regular"
            color="secondary"
          >
            The donation contract forwards to the campaign's payout address even
            if the campaign fails to meet its goal.{' '}
            {!isLoggedIn ? (
              <>
                <Link className="text-blue-500" to={'/auth/login'}>
                  Login
                </Link>{' '}
                to pledge.
              </>
            ) : null}
          </WCText>
        }
        uri={state.context.donationAddress}
        imageAlt="Tip address QR"
        imageUrl={bchLogo}
        onGoBack={() => send('back')}
        showBackBtn
        footer={
          <>
            <AddressFooter address={state.context.donationAddress} />
            <InfoFooter className="text-center">
              <WCText variant="small-regular">
                <a
                  href={state.context.donationAddress}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  Open
                </a>{' '}
                your default wallet. Manually close the modal after donating.
              </WCText>
            </InfoFooter>
          </>
        }
      />
    )
  } else if (state.matches('choose_amount')) {
    route = (
      <ChoosePledgeAmountView
        title="Enter a pledge amount"
        goal={goal}
        raised={campaign.raised}
        minimum={minimum}
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
  } else if (state.matches('anyonecanpay_message')) {
    route = (
      <MessageView
        title="Comment"
        showName={false}
        username={campaign.campaigner.fullName}
        onSubmit={(name, comment) => {
          send('anyonecanpay_message', { name, comment })
        }}
        onSkip={() => send('anyonecanpay_message', {})}
        onGoBack={() => send('back')}
        showBackBtn={true}
      />
    )
  } else if (state.matches('anyonecanpay_payload')) {
    route = (
      <AnyonecanpayView
        donationAmount={state.context.amount as number}
        name={state.context.name}
        comment={state.context.comment}
        expires={campaign.expires}
        campaignId={state.context.campaignId}
        recipients={campaign.recipients}
        title={
          <div>
            <span>
              Pledge to{' '}
              <span className="whitespace-nowrap">
                {campaign.campaigner.fullName}
              </span>{' '}
              Campaign
            </span>
          </div>
        }
        onGoBack={() => send('back')}
        nextStep={(payload) => send('anyonecanpay_confirmed', { payload })}
      />
    )
  } else if (state.matches('choose_refund_address')) {
    route = (
      <ManualAddressView
        title="Scan or paste refund address"
        showBackBtn={true}
        onGoBack={() => send('back')}
        defaultNetwork={campaign.network}
        networks={[campaign.network]}
        allowNetworkChange={false}
        onAddressChange={(address, network) => {
          send({
            type: 'refund_address_selected',
            refundAddress: formatAddress(network, address),
          })
        }}
      />
    )
  } else if (state.matches('confirm_details')) {
    const [amount, denomination] = prettyPrintSats(
      state.context.amount as number
    )

    route = (
      <ConfirmDetailsView
        title="Confirm pledge details"
        address={state.context.refundAddress as string}
        wallet={state.context.wallet as WalletData}
        amount={amount + denomination}
        showBackBtn={true}
        onGoBack={() => send('back')}
        onNext={() =>
          send({
            type: 'details_confirmed',
          })
        }
      />
    )
  } else if (
    state.matches('payment_qr') ||
    state.matches('fetch_payment_request')
  ) {
    route = (
      <PaymentView
        paymentUrl={state.context.paymentUrl}
        requestId={state.context.requestId}
        onGoBack={() => send('back')}
        nextStep={() => {
          send({
            type: 'pledge_deposited',
          })
        }}
      />
    )
  } else if (state.matches('leave_message')) {
    //TODO: add both exit and forward contract download (forward must wait for event which requires another subscription or second event)
    route = (
      <LeaveMessageView
        showName={!isLoggedIn}
        campaignId={campaign.id}
        campaignerName={campaign.campaigner.fullName}
        secret={state.context.secret as string}
        nextStep={() => onClose()}
      />
    )
  } else if (state.matches('completed')) {
    //TODO: add both exit and forward contract download (forward must wait for event which requires another subscription or second event)
    route = (
      <CompletePledgeView
        refundUrl={`/campaign/pledge/refund/${state.context.secret}`}
      />
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

function AddressFooter({ address }: { address?: string | null }) {
  return address ? (
    <div className="pb-5 px-4">
      <WCText variant="small-regular" className="pl-2 truncate" color="accent">
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
