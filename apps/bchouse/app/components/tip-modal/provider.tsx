import { useLocation, useSearchParams } from '@remix-run/react'
import { useMachine } from '@xstate/react'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import { Network, formatAddress } from '~/utils/bchUtils'
import { tipPostModalMachine } from '../machines/tip-modal-machine'

type TipPostData = {
  authorDisplayName: string
  postId: string
  network: Network
  bchAddress: string
}

export const TipPostModalContext = createContext<{
  tipPost: TipPostData | null
  setTipPost: (tipPost: TipPostData | null) => void
} | null>(null)

export function useTipPostModal() {
  const ctx = useContext(TipPostModalContext)

  if (typeof ctx === 'undefined' || ctx === null) {
    throw new Error('useTipPostModal must be a child of TipPostModalProvider')
  }

  return ctx
}

export function TipPostModalProvider({
  children,
}: {
  children?: React.ReactNode
}) {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const showTip = searchParams.get('modal') === 'tip'
  const tipPost = showTip ? (location.state?.tipPost as TipPostData) : null

  const openModal = (tipPost: TipPostData) => {
    const existingSearchParams = Object.fromEntries(searchParams.entries())
    setSearchParams(
      new URLSearchParams({
        ...existingSearchParams,
        modal: 'tip',
      }),
      {
        preventScrollReset: true,
        replace: false,
        state: { tipPost, machineState: undefined },
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
    if (showTip && !tipPost) {
      //TODO: Show error if data lost
      closeModal()
    }
  }, [showTip, tipPost])

  const setTipPost = useCallback(
    (tipPost: TipPostData | null) =>
      tipPost ? openModal(tipPost) : closeModal(),
    []
  )

  const ctx = useMemo(() => {
    return { tipPost, setTipPost }
  }, [tipPost, setTipPost])

  return (
    <TipPostModalContext.Provider value={ctx}>
      {children}
    </TipPostModalContext.Provider>
  )
}

export function usePersistedTipMachine(onClose: () => void) {
  const location = useLocation()
  const { tipPost } = useTipPostModal()

  const persistedState = useMemo(() => {
    if (tipPost && location.state?.machineState) {
      return JSON.parse(location.state.machineState) as any
    }
    return undefined
  }, [tipPost, location.state?.machineState])

  const [state, send] = useMachine(tipPostModalMachine, {
    state: persistedState,
    context: {
      postId: tipPost?.postId,
      bchAddress: formatAddress(
        tipPost?.network as Network,
        tipPost?.bchAddress as string
      ),
    },
    actions: {
      onClose: () => onClose(),
    },
  })

  useEffect(() => {
    if (
      !tipPost ||
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
          tipPost,
          machineState: JSON.stringify(state),
        },
      },
      ''
    )
  }, [tipPost, state])

  return [state, send] as const
}
