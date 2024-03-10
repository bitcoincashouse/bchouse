import React from 'react'
import { useDebounceValue } from 'usehooks-ts'
import { UserPopover, useUserPopover } from '~/components/user-popover'
import { classNames } from '~/utils/classNames'

export function UserPopoverLink<T extends React.ElementType>({
  id,
  children,
  as,
}: {
  as?: T
  id: string
  children: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, keyof T>) {
  const [isHovering, setIsHovering] = useDebounceValue(false, 500)
  const { setReferenceElement, setPopperElement, styles, attributes } =
    useUserPopover()
  const Component = as || 'div'

  return (
    <Component
      onMouseOver={() => setIsHovering(true)}
      onMouseOut={() => setIsHovering(false)}
      data-id={id}
      ref={isHovering ? setReferenceElement : undefined}
    >
      {children}
      {isHovering ? (
        <div
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className={classNames(
            'z-40 bg-primary border dark:border-gray-700 p-4 rounded-xl drop-shadow-md',
            attributes.popper?.className
          )}
        >
          <UserPopover id={id} />
        </div>
      ) : null}
    </Component>
  )
}
