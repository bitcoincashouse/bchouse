import { WalletConnectModal, useWalletConnect } from '@bchouse/cashconnect'
import { useCallback } from 'react'
import ReactDOM from 'react-dom'
import { ClientOnly } from '~/components/client-only'
import { TipPostModalProvider, useTipPostModal } from './provider'
import { TipPostModalRoutes } from './routes'

export { TipPostModalProvider, useTipPostModal }
export const TipPostModal = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { setReferenceElement, close } = useWalletConnect()
  const { tipPost, setTipPost } = useTipPostModal()
  const onClose = useCallback(async () => {
    await close()
    setTipPost(null)
  }, [setTipPost, close])

  return tipPost ? (
    <ClientOnly>
      {() =>
        ReactDOM.createPortal(
          <WalletConnectModal ref={setReferenceElement} onClose={onClose}>
            <TipPostModalRoutes
              {...tipPost}
              isLoggedIn={isLoggedIn}
              //Compensate for typical max fee (2000 for pledges + 3000 for start with forwarding)
              onClose={onClose}
            />
          </WalletConnectModal>,
          document.querySelector('body') as HTMLElement
        )
      }
    </ClientOnly>
  ) : null
}
