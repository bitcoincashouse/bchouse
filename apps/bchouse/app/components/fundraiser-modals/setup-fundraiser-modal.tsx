import {
  ChooseAmountView,
  ConfirmDetailsView,
  ManualAddressView,
  ManualExpirationView,
  WalletConnectModal,
} from '@bchouse/cashconnect'
import {
  Network,
  SATS_PER_BCH,
  getPrefix,
  moment,
  prettyPrintSats,
} from '@bchouse/utils'
import React from 'react'
import ReactDOM from 'react-dom'
import { ClientOnly } from '~/components/client-only'
import { ExtractStepData, StepRoute, useSteps } from '../StepRoutes/step'
import { useCurrentUser } from '../context/current-user-context'

type Steps =
  | {
      step: 1
      data: {}
    }
  | {
      step: 2
      data: ExtractStepData<Steps, 1> & {
        amount: number
      }
    }
  | {
      step: 3
      data: ExtractStepData<Steps, 2> & {
        newAddress: {
          address: string
          network: Network
        }
      }
    }
  | {
      step: 4
      data: ExtractStepData<Steps, 3> & {
        selectedAddress: {
          address: string
          network: Network
        }
      }
    }

export const SetupFundraiserModal = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof SetupFundraiserModalRoutes> & {}
>(({ ...props }, ref) => {
  return (
    <ClientOnly>
      {() =>
        ReactDOM.createPortal(
          <WalletConnectModal ref={ref} onClose={() => props.onClose(null)}>
            <SetupFundraiserModalRoutes {...props} />
          </WalletConnectModal>,
          document.querySelector('body') as HTMLElement
        )
      }
    </ClientOnly>
  )
})

function SetupFundraiserModalRoutes({
  onClose,
}: {
  onClose: (
    monetization: {
      payoutAddress: string
      amount: number
      network: Network
      expires: number
    } | null
  ) => void | Promise<void>
}) {
  const [step, stepTo] = useSteps<Steps>({
    step: 1,
    data: {},
  })

  let route

  const currentUser = useCurrentUser()

  if (step.step === 1) {
    route = (
      <ChooseAmountView
        showBackBtn={false}
        minimum={8000}
        maximum={
          !currentUser.isAnonymous && !currentUser.isAdmin
            ? 0.1 * SATS_PER_BCH
            : undefined
        }
        onAmountSelected={(amount) => stepTo(2, { amount })}
      />
    )
  } else if (step.step === 2) {
    const allowedNetworks =
      !currentUser.isAnonymous && !currentUser.isAdmin
        ? (['chipnet'] as const)
        : (['chipnet', 'mainnet'] as const)

    route = (
      <ManualAddressView
        showBackBtn={true}
        onGoBack={() => stepTo(1, step.data)}
        defaultNetwork={window.env.BCH_NETWORK}
        allowNetworkChange
        networks={allowedNetworks}
        onAddressChange={(address, network) =>
          stepTo(3, {
            ...step.data,
            newAddress: {
              address,
              network,
            },
          })
        }
      />
    )
  } else if (step.step === 3) {
    const [amount, denomination] = prettyPrintSats(step.data.amount)
    const address = `${getPrefix(step.data.newAddress.network)}:${
      step.data.newAddress.address
    }`

    route = (
      <ConfirmDetailsView
        showBackBtn={true}
        onGoBack={() => stepTo(2, step.data)}
        title="Confirm campaign details"
        address={address}
        amount={amount + denomination}
        onNext={() =>
          stepTo(4, { ...step.data, selectedAddress: step.data.newAddress })
        }
      />
    )
  } else if (step.step === 4) {
    route = (
      <ManualExpirationView
        showBackBtn={true}
        onGoBack={() => stepTo(3, step.data)}
        onExpirationChange={(expires) => {
          onClose({
            payoutAddress: step.data.selectedAddress.address,
            network: step.data.selectedAddress.network,
            amount: step.data.amount,
            expires: moment(expires).unix(),
          })
        }}
      />
    )
  }

  return <StepRoute step={step.step}>{route}</StepRoute>
}
