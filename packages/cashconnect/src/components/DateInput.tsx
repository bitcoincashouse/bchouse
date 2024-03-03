import { moment } from '@bchouse/utils'
import { useMemo } from 'react'
import { DateTimePicker } from '~/components/DatetimePicker'
import { cn } from '~/utils/cn'

export function DateInput({
  onChange,
  expires,
  ...props
}: Omit<React.ComponentProps<'input'>, 'onChange'> & {
  expires?: Date | null
  onChange: (expires: Date) => void
}) {
  const defaultDate = useMemo(() => {
    return expires || moment().endOf('day').toDate()
  }, [])

  return (
    <>
      <div className={cn(props.className, 'wcm-date-input')}>
        <label
          htmlFor="company-website"
          className="block sr-only text-sm font-medium leading-6 text-primary-text"
        >
          Expiration
        </label>
        <div className="mt-2 flex justify-center rounded-md w-full">
          <DateTimePicker
            date={defaultDate}
            setDate={(date) => onChange(date)}
          />
        </div>
      </div>
    </>
  )
}
