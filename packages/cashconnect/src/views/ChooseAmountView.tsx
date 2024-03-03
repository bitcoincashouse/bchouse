import { MAX_SATOSHIS, MIN_SATOSHIS } from '@bchouse/utils'
import { useState } from 'react'
import DonationAmount from '~/components/DonationAmount'
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

export function ChoosePledgeAmountView({
  onAmountSelected,
  title = 'Enter a target amount',
  showBackBtn = false,
  onGoBack,
  footer,
  goal,
  raised,
  minimum = MIN_SATOSHIS,
  maximum = MAX_SATOSHIS,
}: {
  onAmountSelected: (amount: number) => void
  title?: string
  goal: number
  raised: number
  minimum?: number
  maximum?: number
  showBackBtn?: boolean
  onGoBack?: () => void
  footer?: string
}) {
  const [amount, setAmount] = useState(0)

  return (
    <div className="wcm-desktop-connecting-view">
      <WCHeader
        title={title}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
        actionIcon={SvgUtil.SCAN_ICON}
      ></WCHeader>
      <Content
        mainClassName={cn('flex flex-col justify-center gap-1 !px-2 w-full')}
      >
        {/* TODO: Keep list of saved addresses and display */}
        <DonationAmount
          current={raised}
          defaultCurrency="BCH"
          defaultDonationAmount={0}
          goal={goal}
          minimum={minimum}
          onDonationAmountChanged={(amount) => setAmount(amount)}
        />

        <WCButton
          disabled={!amount || amount < minimum || amount > maximum}
          buttonClassName="!transition-none flex flex-row items-center"
          onClick={() => {
            onAmountSelected(amount)
          }}
          iconLeft={SvgUtil.CHECKMARK_ICON}
          variant="default"
        >
          Done
        </WCButton>
      </Content>

      {footer ? (
        <InfoFooter>
          <WCText color="secondary" variant="small-thin">
            {footer}
          </WCText>
        </InfoFooter>
      ) : null}
    </div>
  )
}

export function ChooseAmountView({
  onAmountSelected,
  title = 'Enter a target amount',
  showBackBtn = false,
  onGoBack,
  footer,
  minimum = MIN_SATOSHIS,
  maximum = MAX_SATOSHIS,
}: {
  onAmountSelected: (amount: number) => void
  minimum?: number
  maximum?: number
  title?: string
  showBackBtn?: boolean
  onGoBack?: () => void
  footer?: string
}) {
  const [amount, setAmount] = useState(0)

  return (
    <div className="wcm-desktop-connecting-view">
      <WCHeader
        title={title}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
        actionIcon={SvgUtil.SCAN_ICON}
      ></WCHeader>
      <Content
        mainClassName={cn('flex flex-col justify-center gap-1 !px-2 w-full')}
      >
        {/* TODO: Keep list of saved addresses and display */}
        <DonationAmount
          defaultCurrency="BCH"
          minimum={minimum}
          maximum={maximum}
          defaultDonationAmount={0}
          onDonationAmountChanged={(amount) => setAmount(amount)}
        />

        <WCButton
          disabled={!amount || amount < minimum || amount > maximum}
          buttonClassName="!transition-none flex flex-row items-center"
          onClick={() => {
            onAmountSelected(amount)
          }}
          iconLeft={SvgUtil.CHECKMARK_ICON}
          variant="default"
        >
          Done
        </WCButton>
      </Content>

      {footer ? (
        <InfoFooter>
          <WCText color="secondary" variant="small-thin">
            {footer}
          </WCText>
        </InfoFooter>
      ) : null}
    </div>
  )
}
