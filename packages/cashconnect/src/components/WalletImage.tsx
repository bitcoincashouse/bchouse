import { cn } from '~/utils/cn'
import { WalletData } from '../core/types/controllerTypes'
import { SvgUtil } from '../utils/SvgUtil'

export function WalletImage({
  wallet,
  ...props
}: {
  wallet?: WalletData
} & Omit<React.ComponentProps<'img'>, 'src'>) {
  return (
    <div className={cn('wcm-wallet-image', props.className)}>
      {wallet ? (
        <div>
          <img crossOrigin="anonymous" src={wallet.image} alt={wallet.name} />
        </div>
      ) : (
        SvgUtil.WALLET_PLACEHOLDER
      )}
    </div>
  )
}
