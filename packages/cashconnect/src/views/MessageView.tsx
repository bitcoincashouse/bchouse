import { useRef } from 'react'
import { cn } from '~/utils/cn'
import { WCButton } from '../components/Button'
import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { WCText } from '../components/Text'
import { SvgUtil } from '../utils/SvgUtil'

export function MessageView({
  title = 'Pledge succeeded',
  username,
  onSkip,
  onSubmit,
  showName,
  footer,
  onGoBack,
  showBackBtn,
}: {
  showName: boolean
  title?: string
  username: string
  onSubmit: (name: string, comment: string) => void
  onSkip: () => void
  onGoBack?: () => void
  showBackBtn?: boolean
  footer?: React.ReactNode
}) {
  const nameRef = useRef<HTMLInputElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="wcm-desktop-connecting-view">
      <WCHeader
        className="!pb-2"
        title={title}
        actionIcon={SvgUtil.SCAN_ICON}
        onGoBack={onGoBack}
        showBackBtn={showBackBtn}
      ></WCHeader>
      <WCText variant="small-regular">
        Leave a public message for {username}!
      </WCText>

      <Content
        mainClassName={cn(
          'flex flex-col justify-center gap-1 !px-4 w-full !pt-4'
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-4 font-wcm text-sm">
            <div>
              <input
                ref={nameRef}
                type="text"
                name="name"
                placeholder="Name"
                className={cn(
                  'w-full rounded-full px-[10px] py-0 !leading-[28px] tracking-[-0.03em] bg-[rgb(228,231,231)] dark:bg-[rgb(20,20,20)]',
                  !showName && 'hidden'
                )}
              />
            </div>
            <div>
              <textarea
                ref={commentRef}
                name="comment"
                placeholder="Write a comment"
                className="w-full rounded-2xl px-[10px] py-0 !leading-[28px] tracking-[-0.03em] bg-[rgb(228,231,231)] dark:bg-[rgb(20,20,20)]"
              />
            </div>
          </div>

          <div className="flex flex-row justify-end gap-2">
            <WCButton
              type="button"
              buttonClassName="!transition-none flex flex-row items-center"
              onClick={onSkip}
              variant="outline"
            >
              Skip
            </WCButton>
            <WCButton
              type="button"
              buttonClassName="!transition-none flex flex-row items-center"
              onClick={() =>
                onSubmit(
                  nameRef.current?.value || '',
                  commentRef.current?.value || ''
                )
              }
              variant="default"
            >
              Next
            </WCButton>
          </div>
        </div>
      </Content>

      {footer}
    </div>
  )
}
