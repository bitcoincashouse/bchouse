import SignClient from '@walletconnect/sign-client'
import { SessionTypes, SignClientTypes } from '@walletconnect/types'
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
import { getUserAddress } from './wc2.client'

const WalletConnectSessionContext = createContext<{
  signClient: SignClient | null
  session: SessionTypes.Struct | null
  address: string | null
  setSession: (
    sessionInfo: { session: SessionTypes.Struct; address: string } | null
  ) => void
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

const chain =
  typeof window !== 'undefined' && window.env.BCH_NETWORK !== 'mainnet'
    ? 'bch:bchtest'
    : 'bch:bitcoincash'

export function WalletConnectSessionProvider({
  children,
}: {
  children?: React.ReactNode
}) {
  const isHydrated = useHydrated()
  const hasRunRef = useRef(false)

  const [signClient, setSignClient] = useState<SignClient | null>(null)
  const [sessionInfo, setSession] = useState<{
    session: SessionTypes.Struct
    address: string
  } | null>(null)
  const [open, setOpen] = useState(false)
  const sessionRef = useRef<SessionTypes.Struct | null>(null)
  sessionRef.current = sessionInfo?.session ?? null

  useEffect(() => {
    if (isHydrated && !hasRunRef.current) {
      hasRunRef.current = true

      SignClient.init({
        projectId: window.env.WALLET_CONNECT_PROJECT_ID,
        relayUrl: 'wss://relay.walletconnect.com',
        metadata: {
          name: 'BCHouse',
          description: 'BCHouse is social media for BCH',
          url: 'https://bchouse.app',
          icons: ['https://bchouse.app/assets/images/bchouse.svg'],
        },
      }).then((signClient) => {
        setSignClient(signClient)

        const session = signClient.session.getAll().at(-1)

        if (session) {
          pTimeout(
            signClient
              .ping({
                topic: session.pairingTopic,
              })
              .then(() => getUserAddress(signClient, session))
              .then((address) => {
                if (address) {
                  setSession({ session, address })
                } else {
                  signClient.disconnect({
                    topic: session.topic,
                    reason: getSdkError('USER_DISCONNECTED'),
                  })
                }
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
      })
    }
  }, [isHydrated])

  useEffect(() => {
    if (!signClient) return

    const onSessionDelete = ({
      topic,
    }: SignClientTypes.EventArguments['session_delete']) => {
      if (sessionRef.current && topic === sessionRef.current.topic) {
        alert('Session deleted')
        setSession(null)
      }
    }

    signClient.on('session_delete', onSessionDelete)

    return () => {
      signClient.removeListener('session_delete', onSessionDelete)
    }
  }, [signClient])

  const state = useMemo(() => {
    return {
      open,
      setOpen,
      session: sessionInfo?.session || null,
      address: sessionInfo?.address || null,
      setSession,
      signClient,
    }
  }, [open, setOpen, sessionInfo, setSession, signClient])

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
