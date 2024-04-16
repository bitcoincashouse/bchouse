import { SessionTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import pTimeout from 'p-timeout'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useHydrated } from './use-hydrated'
import { signClient } from './wc2.client'

const WalletConnectSessionContext = createContext<{
  session: SessionTypes.Struct | null
  setSession: (session: SessionTypes.Struct | null) => void
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

export function WalletConnectSessionProvider({
  children,
}: {
  children?: React.ReactNode
}) {
  const isHydrated = useHydrated()
  const hasRunRef = useRef(false)

  const [session, setSession] = useState<SessionTypes.Struct | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (isHydrated && !hasRunRef.current) {
      hasRunRef.current = true
      const session = signClient.session.getAll().at(-1)
      if (!session) return

      pTimeout(
        signClient
          .ping({
            topic: session.pairingTopic,
          })
          .then(() => {
            setSession(session)
          }),
        {
          milliseconds: 5000,
        }
      ).catch((err) => {
        console.log('Disconnecting from stale session')

        signClient.disconnect({
          topic: session.topic,
          reason: getSdkError('USER_DISCONNECTED'),
        })
      })
    }
  }, [isHydrated])

  const state = useMemo(() => {
    return {
      open,
      setOpen,
      session,
      setSession,
    }
  }, [open, setOpen, session, setSession])

  return (
    <WalletConnectSessionContext.Provider value={state}>
      {children}
    </WalletConnectSessionContext.Provider>
  )
}

export function useWalletConnectSession() {
  const ctx = useContext(WalletConnectSessionContext)
  if (ctx === null) {
    throw new Error(
      'useWalletConnectSession must be a child of WalletConnectSessionProvider'
    )
  }

  return ctx
}
