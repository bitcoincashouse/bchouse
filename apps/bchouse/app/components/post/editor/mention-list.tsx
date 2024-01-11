import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { BaseUserCard } from '~/components/user-card'
import { classNames } from '~/utils/classNames'

import { ReactRendererOptions } from '@tiptap/react'

import { SuggestionProps } from '@tiptap/suggestion'
// import type { RoleType } from '~/server/db/index'

type UserMentionData = {
  id: string
  display: string
  username: string
  fullName: string
  avatarUrl: string
  createdAt: string
  bchAddress: string
}

export type MentionListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const MentionList = forwardRef<
  MentionListRef,
  SuggestionProps<UserMentionData> & {
    editor: ReactRendererOptions['editor']
  }
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]

    if (item) {
      props.command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    )
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  return (
    <div className="max-w-[320px] translate-y-4 bg-primary">
      <div className="overflow-y-auto border shadow rounded-lg">
        <div className="items">
          {props.items.length
            ? props.items.map((item, index) => (
                <button
                  type="button"
                  className={`item ${
                    index === selectedIndex ? 'is-selected' : ''
                  }`}
                  key={index}
                  onClick={() => {
                    selectItem(index)
                  }}
                >
                  <div
                    className={classNames(
                      '[&*:hover]:no-underline cursor-pointer'
                    )}
                  >
                    <BaseUserCard
                      noLinks
                      user={item}
                      onClick={(e) => {
                        selectItem(index)
                      }}
                    />
                  </div>
                </button>
              ))
            : null}
        </div>
      </div>
    </div>
  )
})
