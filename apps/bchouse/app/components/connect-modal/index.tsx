import { WalletConnectModal } from '@bchouse/cashconnect'
import React from 'react'
import ReactDOM from 'react-dom'
import { ClientOnly } from '~/components/client-only'
import { ConnectModalRoutes } from './routes'

export const ConnectWalletModal = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ConnectModalRoutes> & {}
>(({ ...props }, ref) => {
  return (
    <ClientOnly>
      {() =>
        ReactDOM.createPortal(
          <WalletConnectModal ref={ref} onClose={() => props.onClose()}>
            <ConnectModalRoutes {...props} />
          </WalletConnectModal>,
          document.querySelector('body') as HTMLElement
        )
      }
    </ClientOnly>
  )
})
