import { cn } from '~/utils/cn'
import { WCButton } from '../components/Button'
import { InfoFooter } from '../components/InfoFooter'
import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { WCText } from '../components/Text'
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

export function CompletePledgeView({
  title = 'Pledge succeeded',
  refundUrl,
}: {
  refundUrl: string
  title?: string
}) {
  return (
    <div className="wcm-desktop-connecting-view">
      <WCHeader title={title} actionIcon={SvgUtil.SCAN_ICON}></WCHeader>
      <Content
        mainClassName={cn('flex flex-col justify-center gap-1 !px-2 w-full')}
      >
        {/* TODO: Keep list of saved addresses and display */}
        <div className="my-4">
          <WCText className="mb-6" variant="small-thin">
            Visit the following page to manually revoke your contribution. Make
            sure to bookmark it!
          </WCText>

          <div className="flex flex-row justify-around">
            <WCButton
              buttonClassName="!transition-none flex flex-row items-center"
              onClick={() => CoreUtil.openHref(refundUrl, '_blank')}
              iconLeft={SvgUtil.GLOBE_ICON}
              variant="default"
            >
              Revoke pledge
            </WCButton>
          </div>
        </div>
      </Content>

      <div className="wcm-legal-notice">
        <InfoFooter>
          <WCText color="secondary" variant="small-thin">
            The above url can be found in your wallet along with all relevant
            contract parameters.
          </WCText>
        </InfoFooter>
      </div>
    </div>
  )
}
