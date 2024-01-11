import { cn } from '~/utils/cn'
import { SvgUtil } from '../utils/SvgUtil'

export function PlainImage(props: React.ComponentProps<'img'>) {
  return (
    <div className={cn('wcm-wallet-image', props.className)}>
      {props.src?.length ? (
        <img crossOrigin="anonymous" src={props.src} alt={props.alt} />
      ) : (
        SvgUtil.WALLET_PLACEHOLDER
      )}
    </div>
  )
}
