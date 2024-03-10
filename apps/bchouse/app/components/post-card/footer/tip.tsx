import { prettyPrintSats } from '@bchouse/utils'
import { useMemo } from 'react'
import { BitcoinIcon } from '~/components/icons/BitcoinIcon'
import { PostCardModel } from '~/components/post/types'
import { useTipPostModal } from '~/components/tip-modal'
import { classNames } from '~/utils/classNames'

export const TipButton = ({ item }: { item: PostCardModel }) => {
  const [tipAmountStr, denomination] = useMemo(() => {
    return prettyPrintSats(item.tipAmount)
  }, [item.tipAmount])
  const { setTipPost } = useTipPostModal()

  return (
    <button
      type="button"
      className={classNames(
        'inline-flex gap-1 items-center cursor-pointer group',
        item.wasTipped ? 'text-[#0ac18e]' : ''
      )}
      title="Tip"
      onClick={(e) => {
        e.stopPropagation()
        setTipPost({
          authorDisplayName: item.person.name || item.person.handle,
          postId: item.id,
          network: window.env.BCH_NETWORK,
          bchAddress: item.person.bchAddress as string,
        })
      }}
    >
      <BitcoinIcon
        title="Tip"
        className={classNames(
          'w-5 h-5 flex items-center group-hover:ring-8 group-hover:bg-[#0ac18e]/20 group-hover:ring-[#0ac18e]/20 transition-all ease-in-out duration-300 rounded-full',
          item.wasTipped && 'fill-[#0ac18e]'
        )}
      />
      {item.tipAmount && (
        <span className="text-sm">
          {tipAmountStr}
          <small className="text-xs">{denomination}</small>
        </span>
      )}
    </button>
  )
}
