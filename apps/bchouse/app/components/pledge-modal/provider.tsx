import { Network } from '@bchouse/utils'
import { useLocation, useSearchParams } from '@remix-run/react'
import { useMachine } from '@xstate/react'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import { pledgeModalMachine } from '../machines/pledge-modal.machine'
import { useHydrated } from '../utils/use-hydrated'

export type PledgeData = {
  campaign: {
    id: string
    raised: number
    network: Network
    expires: number
    donationAddress: string
    campaigner: {
      fullName: string
    }
    recipients: {
      address: string
      satoshis: number
    }[]
    version: number
  }
}

export const PledgeModalContext = createContext<{
  pledge: PledgeData | null
  setPledge: (pledge: PledgeData | null) => void
} | null>(null)

export function usePledgeModal() {
  const ctx = useContext(PledgeModalContext)

  if (typeof ctx === 'undefined' || ctx === null) {
    throw new Error('usePledgeModal must be a child of PledgeModalProvider')
  }

  return ctx
}

export function usePersistedPledgeMachine(
  isLoggedIn: boolean,
  onClose: () => void
) {
  const location = useLocation()
  const { pledge } = usePledgeModal()

  const persistedState = useMemo(() => {
    if (pledge && location.state?.machineState) {
      return JSON.parse(location.state.machineState) as any
    }
    return undefined
  }, [pledge, location.state?.machineState])

  const [state, send] = useMachine(pledgeModalMachine, {
    state: persistedState,
    context: {
      isLoggedIn,
      campaignId: pledge?.campaign.id,
      donationAddress: pledge?.campaign.donationAddress,
    },
    actions: {
      onClose: () => onClose(),
    },
  })

  useEffect(() => {
    if (
      !pledge ||
      state.matches('choose_wallet') ||
      typeof window === 'undefined'
    ) {
      return
    }

    window.history.replaceState(
      {
        idx: window.history.state?.idx || 0,
        key: location.key,
        usr: {
          pledge,
          machineState: JSON.stringify(state),
        },
      },
      ''
    )
  }, [pledge, state])

  return [state, send] as const
}

export function PledgeModalProvider({
  children,
}: {
  children?: React.ReactNode
}) {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isHydrated = useHydrated()
  const showPledge = searchParams.get('modal') === 'pledge'
  const pledge =
    isHydrated && showPledge ? (location.state?.pledge as PledgeData) : null

  const openModal = (pledge: PledgeData) => {
    const existingSearchParams = Object.fromEntries(searchParams.entries())
    setSearchParams(
      new URLSearchParams({
        ...existingSearchParams,
        modal: 'pledge',
      }),
      {
        preventScrollReset: true,
        replace: false,
        state: { pledge, machineState: undefined },
      }
    )
  }

  const closeModal = () => {
    const existingSearchParams = Object.fromEntries(searchParams.entries())
    delete existingSearchParams['modal']
    setSearchParams(new URLSearchParams(existingSearchParams), {
      preventScrollReset: true,
      replace: true,
      state: null,
    })
  }

  useEffect(() => {
    if (isHydrated && showPledge && !pledge) {
      //TODO: Show error if data lost
      closeModal()
    }
  }, [isHydrated, showPledge, pledge])

  const setPledge = useCallback(
    (pledge: PledgeData | null) => (pledge ? openModal(pledge) : closeModal()),
    []
  )

  const ctx = useMemo(() => {
    return { pledge, setPledge }
  }, [pledge, setPledge])

  return (
    <PledgeModalContext.Provider value={ctx}>
      {children}
    </PledgeModalContext.Provider>
  )
}
