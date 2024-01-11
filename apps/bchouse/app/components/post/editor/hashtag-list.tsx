import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { classNames } from '~/utils/classNames'

import { ReactRendererOptions } from '@tiptap/react'

import { SuggestionProps } from '@tiptap/suggestion'
// import type { RoleType } from '~/server/db/index'

type HashtagData = {
  hashtag: string
  label: string
}

export type HashtagListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const HashtagList = forwardRef<
  HashtagListRef,
  SuggestionProps<HashtagData> & {
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
                    <div
                      key={item.hashtag}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="block hover:bg-hover cursor-pointer"
                        onClick={(e) => {
                          selectItem(index)
                        }}
                      >
                        <div className={classNames('relative')}>
                          <div className="relative">
                            <div className="relative flex items-start">
                              <>
                                <div className="min-w-0 flex-1 relative">
                                  <div className="flex items-center justify-between overflow-hidden w-full">
                                    <div className="flex-grow min-w-0 overflow-hidden">
                                      <div className="text-[15px] py-4 pl-2 pr-6">
                                        <span className="font-bold text-primary-text hover:underline">
                                          #{item.hashtag}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            : null}
        </div>
      </div>
    </div>
  )
})
