import React, { useEffect, useMemo } from 'react'
import { useDebounceValue } from 'usehooks-ts'
import { PostContentRenderer } from '~/components/post/post-content-renderer'
import { UserPopover, useUserPopover } from '~/components/user-popover'
import { classNames } from '~/utils/classNames'
import { usePost } from './context'

export function PostCardContent(
  props: React.ComponentProps<'div'> & { showFullLength?: boolean }
) {
  const item = usePost()
  const { setReferenceElement, setPopperElement, styles, attributes } =
    useUserPopover()

  const [hoveringMentionElem, setHoveringMentionElem] =
    useDebounceValue<HTMLElement | null>(null, 500)

  useEffect(() => {
    setReferenceElement(hoveringMentionElem)
  }, [hoveringMentionElem])

  const hoveringId = useMemo(() => {
    return hoveringMentionElem?.getAttribute('data-id')
  }, [hoveringMentionElem])

  return (
    <div>
      {item.monetization?.title ? (
        <h1 className="my-2 text-xl text-primary-text font-semibold prose">
          {item.monetization.title}
        </h1>
      ) : null}
      <div
        className={classNames(
          props.className,
          'my-2 text-[15px] text-primary-text prose flex flex-col gap-2 break-word',
          '[&_p]:m-0',
          '[&_img]:aspect-[5/4] [&_img]:object-cover [&_img]:m-0 [&_img]:rounded-lg [&_img]:overflow-hidden [&_img]:relative [&_img]:w-full [&_img]:h-full'
        )}
        onMouseOver={(e) => {
          const target = e.target instanceof HTMLElement ? e.target : null
          if (target?.getAttribute('data-type') === 'mention') {
            setHoveringMentionElem(target)
          }
        }}
        onMouseOut={(e) => {
          const target = e.target instanceof HTMLElement ? e.target : null
          if (target?.getAttribute('data-type') === 'mention') {
            setHoveringMentionElem(null)
          }
        }}
      >
        <PostContentRenderer
          content={item.content}
          showFullLength={props.showFullLength}
        />
      </div>
      {hoveringId ? (
        <div
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className={classNames(
            'z-40 bg-primary border dark:border-gray-700 p-4 rounded-xl drop-shadow-md',
            attributes.popper?.className
          )}
        >
          <UserPopover id={hoveringId} />
        </div>
      ) : null}
    </div>
  )
}
