import { animate } from 'motion'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '~/utils/cn'
import { logger } from '~/utils/logger'
import { Backcard } from '../components/ModalBackcard'
import { Toast } from '../components/ModalToast'
import { ExplorerCtrl } from '../core/controllers/ExplorerCtrl'
import type { OpenOptions } from '../core/controllers/ModalCtrl'
import { ThemeCtrl } from '../core/controllers/ThemeCtrl'
import { ToastCtrl } from '../core/controllers/ToastCtrl'
import { ThemeUtil } from '../utils/ThemeUtil'
import { UiUtil } from '../utils/UiUtil'

type Target = HTMLElement | undefined

function toggleBodyScroll(enabled: boolean) {
  if (typeof document === 'undefined') return

  const body = document.querySelector('body')
  if (body) {
    if (enabled) {
      const wcmStyles = document.getElementById('wcm-styles')
      wcmStyles?.remove()
    } else {
      document.head.insertAdjacentHTML(
        'beforeend',
        `<style id="wcm-styles">html,body{touch-action:none;overflow:hidden;overscroll-behavior:contain;}</style>`
      )
    }
  }
}

const WalletConnectContext = React.createContext<{
  active: boolean
  config: OpenOptions['config']
  close: () => Promise<void>
  setReferenceElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>
  setOverlayRef: (ref: HTMLDivElement) => void
  setContainerRef: (ref: HTMLDivElement) => void
} | null>(null)

export function useWalletConnectContext() {
  const ctx = React.useContext(WalletConnectContext)
  if (!ctx || !ctx?.config) {
    throw new Error(
      'useWalletConnectContext cannot be used outside WalletConnectProvider'
    )
  }
  return ctx
}

export const useWalletConnect = useWalletConnectContext

export function WalletConnectProvider({
  children,
  config,
  onClose,
  onOpen,
  preload = false,
  theme = 'dark',
}: {
  theme?: 'dark' | 'light'
  onClose?: () => void
  onOpen?: () => void
  children?: React.ReactNode
  config: OpenOptions['config']
  preload?: boolean
}) {
  const [active, setActive] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const keyboardAbortControllerRef = useRef<AbortController>()

  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null
  )

  const ctx = useMemo(() => {
    return {
      active,
      config: {
        scanMobileWalletOnDesktop: true,
        ...config,
      },
      setReferenceElement,
      setOverlayRef: (ref: HTMLDivElement) => (overlayRef.current = ref),
      setContainerRef: (ref: HTMLDivElement) => (containerRef.current = ref),
      close: async function onCloseModal() {
        const overlayEl = overlayRef.current
        const containerEl = containerRef.current
        if (!overlayEl || !containerEl) return

        // toggleBodyScroll(true)
        removeKeyboardEvents()
        const animation = UiUtil.isMobileAnimation()
          ? { y: ['0vh', '50vh'] }
          : { scale: [1, 0.98] }
        const duration = 0.2
        await Promise.all([
          animate(overlayEl, { opacity: [1, 0] }, { duration }).finished,
          animate(containerEl, animation, { duration }).finished,
        ])
        containerEl.removeAttribute('style')
        onClose?.()
      },
    }
  }, [config, active])

  useEffect(() => {
    if (!active && referenceElement) {
      setActive(true)
      setTimeout(() => {
        const overlayEl = overlayRef.current
        const containerEl = containerRef.current
        if (!overlayEl || !containerEl) return

        ThemeUtil.setTheme(overlayEl)
        addKeyboardEvents()
        setTimeout(async () => {
          const animation = UiUtil.isMobileAnimation()
            ? { y: ['50vh', '0vh'] }
            : { scale: [0.98, 1] }
          const delay = 0.1
          const duration = 0.2
          await Promise.all([
            animate(overlayEl, { opacity: [0, 1] }, { delay, duration })
              .finished,
            animate(containerEl, animation, { delay, duration }).finished,
          ])
          onOpen?.()
        }, 0)
      }, 0)
    }

    if (active && !referenceElement) {
      setActive(false)
    }
  }, [active, referenceElement, ctx])

  async function loadImages(images?: (string | undefined)[]) {
    try {
      if (images?.length) {
        await Promise.all(
          images.map(async (url) => UiUtil.preloadImage(url as string))
        )
      }
    } catch {
      logger.info('Unsuccessful attempt at preloading some images', images)
    }
  }

  async function preloadListings() {
    if (config.enableExplorer) {
      await ExplorerCtrl.getRecomendedWallets()
      setIsDataLoaded(true)
      const { recomendedWallets } = ExplorerCtrl.state
      const walletImgs = recomendedWallets.map((wallet) =>
        UiUtil.getWalletIcon(wallet)
      )
      await loadImages(walletImgs)
    } else {
      setIsDataLoaded(true)
    }
  }

  async function preloadCustomImages() {
    const images = UiUtil.getCustomImageUrls()
    await loadImages(images)
  }

  async function preloadData() {
    try {
      if (preload) {
        preload = false
        await Promise.all([preloadListings(), preloadCustomImages()])
      }
    } catch (err) {
      logger.error(err)
      ToastCtrl.openToast('Failed preloading', 'error')
    }
  }

  function removeKeyboardEvents() {
    keyboardAbortControllerRef.current?.abort()
    keyboardAbortControllerRef.current = undefined
  }

  useEffect(() => {
    if (theme) {
      ThemeCtrl.state.themeMode = theme
    }

    const overlayEl = overlayRef.current
    if (!overlayEl) return

    ThemeUtil.setTheme(overlayEl)
  }, [theme])

  useEffect(() => {
    if (!overlayRef.current) return

    // Set & Subscribe to theme state
    ThemeUtil.setTheme(overlayRef.current)
    const unsubscribeTheme = ThemeCtrl.subscribe(() => {
      if (!overlayRef.current) return
      ThemeUtil.setTheme(overlayRef.current)
    })

    preloadData()

    return () => {
      unsubscribeTheme?.()
    }
  }, [overlayRef.current])

  function addKeyboardEvents() {
    if (typeof window === 'undefined') return

    const abortController = new AbortController()
    const overlayEl = overlayRef.current
    const containerEl = containerRef.current
    if (!overlayEl || !containerEl) return

    window.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') {
          ctx.close()
        } else if (event.key === 'Tab') {
          if (!(event.target as Target)?.tagName.includes('wcm-')) {
            containerEl.focus()
          }
        }
      },
      abortController
    )
    containerEl.focus()
    keyboardAbortControllerRef.current = abortController
  }

  return (
    <WalletConnectContext.Provider value={ctx}>
      {children}
    </WalletConnectContext.Provider>
  )
}

export const WalletConnectModal = React.forwardRef<
  HTMLDivElement,
  { children?: React.ReactNode; onClose?: () => void }
>(({ children, onClose }, ref) => {
  const { active, close, setOverlayRef, setContainerRef } =
    useWalletConnectContext()

  async function onCloseModalEvent(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose?.()
    }
  }

  async function onCloseHandler() {
    onClose?.()
  }

  const classes = {
    'wcm-overlay': true,
    'wcm-active': active,
  }

  return (
    <div className="wcm-modal" ref={ref} onClick={(e) => e.stopPropagation()}>
      {/* <Style /> */}
      {/* <wcm-explorer-context></wcm-explorer-context> */}
      <div
        id="wcm-modal"
        className={cn(classes)}
        onClick={onCloseModalEvent}
        role="alertdialog"
        aria-modal="true"
        ref={setOverlayRef}
      >
        <div className="wcm-container" ref={setContainerRef}>
          <Backcard onClose={onCloseHandler}></Backcard>
          <div className="wcm-card">
            {/* Switch from ConnectWalletView to next */}
            <>{children}</>
            <Toast />
          </div>
        </div>
      </div>
    </div>
  )
})

function Style() {
  return (
    <style>
      {`*,
*::after,
*::before {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	font-style: normal;
	text-rendering: optimizeSpeed;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	-webkit-tap-highlight-color: transparent;
	backface-visibility: hidden;
}

button {
	cursor: pointer;
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	border: none;
	background-color: transparent;
	transition: all 0.2s ease;
}

@media (hover: hover) and (pointer: fine) {
	button:active {
		transition: all 0.1s ease;
		transform: scale(0.93);
	}
}

button::after {
	content: '';
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	transition:
		background-color,
		0.2s ease;
}

button:disabled {
	cursor: not-allowed;
}

button svg,
button .wcm-text {
	position: relative;
	z-index: 1;
}

input {
	border: none;
	outline: none;
	appearance: none;
}

img {
	display: block;
}

::selection {
	color: var(--wcm-accent-fill-color);
	background: var(--wcm-accent-color);
}`}
    </style>
  )
}
