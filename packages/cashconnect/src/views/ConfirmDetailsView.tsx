import { cn } from '~/utils/cn'
import { InfoFooter } from '../components/InfoFooter'
import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { WCText } from '../components/Text'
import { WalletImage } from '../components/WalletImage'
import { WalletData } from '../core/types/controllerTypes'
import { CoreUtil } from '../core/utils/CoreUtil'
import { SvgUtil } from '../utils/SvgUtil'
import { UiUtil } from '../utils/UiUtil'

async function onFormatAndRedirect(
  wallet: WalletData,
  forceUniversalUrl = false
) {
  const { mobile } = wallet
  const url = await CoreUtil.getWalletValue(
    forceUniversalUrl ? mobile?.universal : mobile?.native
  )

  if (!url) return
  CoreUtil.openHref(url, '_self')
}

function openMobileApp(wallet: WalletData, forceUniversalUrl = false) {
  UiUtil.setRecentWallet(wallet)
  onFormatAndRedirect(wallet, forceUniversalUrl)
}

export function ConfirmDetailsView({
  isError = false,
  onGoBack,
  showBackBtn = false,
  onNext,
  title = 'Select an address',
  address,
  info,
  wallet,
  amount,
}: {
  title?: string
  isError?: boolean
  onGoBack?: () => void
  showBackBtn?: boolean
  info?: string
  wallet?: WalletData
  address?: string
  onNext: () => void
  amount?: string
}) {
  return (
    <div className="wcm-desktop-connecting-view">
      <WCHeader
        title={title}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
        actionIcon={SvgUtil.SCAN_ICON}
      ></WCHeader>
      <Content mainClassName={cn('flex flex-col justify-center gap-3 !px-2')}>
        {/* TODO: Keep list of saved addresses and display */}
        <button
          className="flex flex-row justify-start items-center cursor-pointer
            transition-all
            duration-200
            ease-[ease]
            rounded-[var(--wcm-button-hover-highlight-border-radius)] 
            hover:bg-[var(--wcm-color-overlay)]"
          onClick={() => onNext()}
        >
          {wallet ? (
            <div className="w-20">
              <div className="wcm-wallet-button">
                <div className="!bg-transparent">
                  <div>
                    <WalletImage wallet={wallet} className="!m-0" />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <div
            className={cn(
              !wallet && 'px-[5px]',
              'flex flex-col gap-2 overflow-hidden w-full'
            )}
          >
            <div className="flex flex-row justify-between pr-[5px]">
              {wallet ? (
                <div className="flex flex-col items-start overflow-hidden">
                  <WCText>Sending wallet:</WCText>
                  <WCText
                    variant="small-thin"
                    className="w-full line-clamp-1"
                    spanClassName="text-left block overflow-hidden text-ellipsis"
                  >
                    {wallet.name}
                  </WCText>
                </div>
              ) : null}
              {amount ? (
                <div className="flex flex-col items-start overflow-hidden">
                  <WCText>Amount:</WCText>
                  <WCText
                    variant="small-thin"
                    className="w-full line-clamp-1"
                    spanClassName="text-left block overflow-hidden text-ellipsis"
                  >
                    {amount}
                  </WCText>
                </div>
              ) : null}
            </div>
            {address ? (
              <div className="flex flex-col items-start overflow-hidden">
                <WCText>Return address:</WCText>
                <WCText
                  variant="small-thin"
                  className="w-full line-clamp-1"
                  spanClassName="text-left block overflow-hidden text-ellipsis"
                >
                  {address}
                </WCText>
              </div>
            ) : null}
          </div>
        </button>
      </Content>

      {info ? (
        <InfoFooter>
          <WCText color="secondary" variant="small-thin">
            {info}
          </WCText>
        </InfoFooter>
      ) : null}
    </div>
  )
}
