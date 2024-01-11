import { useState } from 'react'
import { cn } from '~/utils/cn'
import { WCButton } from '../components/Button'
import { DateInput } from '../components/DateInput'
import { InfoFooter } from '../components/InfoFooter'
import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { WCText } from '../components/Text'
import { ToastCtrl } from '../core/controllers/ToastCtrl'
import { SvgUtil } from '../utils/SvgUtil'

export function ManualExpirationView({
  onGoBack,
  showBackBtn = false,
  onExpirationChange,
  title = 'Enter the expiration',
}: {
  onExpirationChange: (expires: Date) => void
  title?: string
  onGoBack?: () => void
  showBackBtn?: boolean
}) {
  const [expires, setExpires] = useState<Date | null>(null)

  function handleExpiration(expiration: Date) {
    setExpires(null)
    if (expiration >= new Date()) {
      setExpires(expiration)
    } else {
      ToastCtrl.openToast('Invalid expiration', 'error')
    }
  }

  return (
    <div className="wcm-desktop-connecting-view">
      <WCHeader
        title={title}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
      ></WCHeader>
      <Content mainClassName={cn('flex flex-col justify-center gap-2')}>
        <DateInput expires={expires} onChange={handleExpiration}></DateInput>

        <div className={cn('flex justify-center')}>
          <WCButton
            disabled={!expires}
            onClick={() => expires && onExpirationChange(expires)}
            iconLeft={SvgUtil.CHECKMARK_ICON}
            buttonClassName="flex flex-row items-center"
          >
            Done
          </WCButton>
        </div>
      </Content>

      <InfoFooter>
        <WCText color="secondary" variant="small-thin">
          {`Contributions will be automatically refunded after expiration`}
        </WCText>
      </InfoFooter>
    </div>
  )
}
