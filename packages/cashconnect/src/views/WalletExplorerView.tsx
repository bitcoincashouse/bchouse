import { useEffect, useRef, useState } from 'react'
import { cn } from '~/utils/cn'
import { logger } from '~/utils/logger'
import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { SearchInput } from '../components/SearchInput'
import { Spinner } from '../components/Spinner'
import { WCText } from '../components/Text'
import { WalletButton } from '../components/WalletButton'
import { ConfigCtrl } from '../core/controllers/ConfigCtrl'
import { ExplorerCtrl } from '../core/controllers/ExplorerCtrl'
import { OptionsCtrl } from '../core/controllers/OptionsCtrl'
import { ToastCtrl } from '../core/controllers/ToastCtrl'
import { Listing } from '../core/types/controllerTypes'
import { CoreUtil } from '../core/utils/CoreUtil'
import { DataUtil } from '../utils/DataUtil'
import { TemplateUtil } from '../utils/TemplateUtil'
import { UiUtil } from '../utils/UiUtil'

const PAGE_ENTRIES = 40

export function WalletExplorerView({ preload = true }) {
  const [loading, setLoading] = useState(
    !ExplorerCtrl.state.wallets.listings.length
  )
  const [firstFetch, setFirstFetch] = useState(
    !ExplorerCtrl.state.wallets.listings.length
  )
  const [endReached, setEndReached] = useState(false)
  const [currentSearch, setCurrentSearch] = useState('')

  // -- lifecycle ---------------------------------------------------- //
  useEffect(() => {
    createPaginationObserver()
    return () => intersectionObserverRef.current?.disconnect()
  }, [])

  const placeholderRef = useRef<HTMLDivElement>(null)
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null)

  function createPaginationObserver() {
    const placeholderEl = placeholderRef.current
    if (!placeholderEl) return

    const intersectionObserver = new IntersectionObserver(([element]) => {
      if (element?.isIntersecting && !(currentSearch && firstFetch)) {
        fetchWallets()
      }
    })
    intersectionObserver.observe(placeholderEl)
    intersectionObserverRef.current = intersectionObserver
  }

  function isLastPage() {
    const { wallets, search } = ExplorerCtrl.state
    const { listings, total } = currentSearch ? search : wallets

    return total <= PAGE_ENTRIES || listings.length >= total
  }

  async function fetchWallets() {
    const { wallets, search } = ExplorerCtrl.state
    const { listings, total, page } = currentSearch ? search : wallets

    if (!ConfigCtrl.state.enableExplorer) {
      setLoading(false)
      setFirstFetch(false)
      return
    }

    if (
      !endReached &&
      (firstFetch || (total > PAGE_ENTRIES && listings.length < total))
    ) {
      try {
        setLoading(true)
        const chains = OptionsCtrl.state.chains?.join(',')
        const { listings: newListings } = await ExplorerCtrl.getWallets({
          page: firstFetch ? 1 : page + 1,
          entries: PAGE_ENTRIES,
          search: currentSearch,
          version: 2,
          chains,
        })
        const explorerImages = newListings.map((wallet) =>
          UiUtil.getWalletIcon(wallet)
        )
        await Promise.all([
          ...explorerImages.map(async (url) =>
            UiUtil.preloadImage(url as string)
          ),
          CoreUtil.wait(300),
        ])
        setEndReached(isLastPage())
      } catch (err) {
        logger.error(err)
        ToastCtrl.openToast(UiUtil.getErrorMessage(err), 'error')
      } finally {
        setLoading(false)
        setFirstFetch(false)
      }
    }
  }

  function onConnect(listing: Listing) {
    if (CoreUtil.isAndroid()) {
      UiUtil.handleMobileLinking(listing)
    } else {
      UiUtil.goToConnectingView(listing)
    }
  }

  function onSearchChange(event: React.ChangeEvent<HTMLElement>) {
    const { value } = event.target as HTMLInputElement
    searchDebounce(value)
  }

  const searchDebounce = UiUtil.debounce((value: string) => {
    if (value.length >= 1) {
      setFirstFetch(true)
      setEndReached(false)
      setCurrentSearch(value)
      ExplorerCtrl.resetSearch()
      fetchWallets()
    } else if (search) {
      setCurrentSearch('')
      setEndReached(isLastPage())
      ExplorerCtrl.resetSearch()
    }
  })

  const { wallets, search } = ExplorerCtrl.state
  const { listings } = currentSearch ? search : wallets
  const isLoading = loading && !listings.length
  const isSearch = currentSearch.length >= 3
  const manualWalletData = DataUtil.manualWallets()
  const recomendedWalletData = DataUtil.recomendedWallets(true)
  let manualWallets = [] as React.ReactNode[]
  let recomendedWallets = [] as React.ReactNode[]

  // If search is active, we only show results matching query
  if (isSearch) {
    manualWallets = TemplateUtil.toNode(
      manualWalletData.filter((node) =>
        UiUtil.caseSafeIncludes(node.name, currentSearch)
      )
    )
    recomendedWallets = TemplateUtil.toNode(
      recomendedWalletData.filter((node) =>
        UiUtil.caseSafeIncludes(node.name, currentSearch)
      )
    )
  } else {
    manualWallets = TemplateUtil.toNode(manualWalletData)
    recomendedWallets = TemplateUtil.toNode(recomendedWalletData)
  }

  const isEmpty = !loading && !listings.length && !recomendedWallets.length
  const classes = {
    'wcm-loading': isLoading,
    'wcm-end-reached': endReached || !loading,
    'wcm-empty': isEmpty,
  }

  return (
    <div className="wcm-wallet-explorer-view">
      <WCHeader>
        <SearchInput onChange={onSearchChange}></SearchInput>
      </WCHeader>

      <Content className={cn(classes)}>
        <div className="wcm-grid">
          {isLoading ? null : manualWallets}{' '}
          {isLoading ? null : recomendedWallets}
          {isLoading
            ? null
            : listings.map((listing) =>
                listing ? (
                  <WalletButton
                    wallet={listing}
                    onClick={() => onConnect(listing)}
                  ></WalletButton>
                ) : null
              )}
        </div>
        <div ref={placeholderRef} className="wcm-placeholder-block">
          {isEmpty ? (
            <WCText variant="big-bold" color="secondary">
              No results found
            </WCText>
          ) : null}
          {!isEmpty && loading ? <Spinner /> : null}
        </div>
      </Content>
    </div>
  )
}
