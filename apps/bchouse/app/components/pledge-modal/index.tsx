import { WalletConnectModal, useWalletConnect } from '@bchouse/cashconnect'
import { useCallback, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { ClientOnly } from '~/components/client-only'
import { PledgeModalProvider, usePledgeModal } from './provider'
import { PledgeFundraiserModalRoutes } from './routes'

export { PledgeModalProvider, usePledgeModal }

export const PledgeFundraiserModal = ({
  isLoggedIn,
}: {
  isLoggedIn: boolean
}) => {
  const { setReferenceElement, close } = useWalletConnect()
  const { pledge, setPledge } = usePledgeModal()
  const onClose = useCallback(async () => {
    await close()
    setPledge(null)
  }, [setPledge, close])

  const goal = useMemo(() => {
    return pledge?.campaign.recipients.reduce((sum, { satoshis }) => {
      return sum + satoshis
    }, 0)
  }, [pledge])

  return pledge && goal ? (
    <ClientOnly>
      {() =>
        ReactDOM.createPortal(
          <WalletConnectModal ref={setReferenceElement} onClose={onClose}>
            <PledgeFundraiserModalRoutes
              {...pledge}
              isLoggedIn={isLoggedIn}
              //Compensate for typical max fee (2000 for pledges + 3000 for start with forwarding)
              goal={goal + 3000}
              minimum={4000}
              onClose={onClose}
            />
          </WalletConnectModal>,
          document.querySelector('body') as HTMLElement
        )
      }
    </ClientOnly>
  ) : null
}
