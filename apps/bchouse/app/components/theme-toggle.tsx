import { Switch } from '@headlessui/react'
import { Fragment } from 'react'
import { Theme, useClientTheme } from './theme-provider'
import { classnames } from './utils/classnames'

export function ThemeToggle() {
  const [theme, setTheme] = useClientTheme()

  return (
    <Switch
      checked={theme === Theme.LIGHT}
      onChange={(enabled) => {
        const nextTheme = enabled ? Theme.LIGHT : Theme.DARK
        setTheme(nextTheme)
      }}
      as={Fragment}
    >
      {({ checked }) => (
        /* Use the `checked` state to conditionally style the button. */
        <button
          disabled={!theme}
          className={classnames(
            checked ? 'bg-blue-600' : 'bg-gray-200',
            'relative inline-flex h-[20px] w-[34px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75'
          )}
        >
          <span className="sr-only">Theme toggle</span>
          <span
            aria-hidden="true"
            className={classnames(
              theme === Theme.LIGHT ? 'translate-x-[14px]' : 'translate-x-0',
              'pointer-events-none inline-block h-[16px] w-[16px] transform rounded-full bg-primary shadow-lg ring-0 transition duration-200 ease-in-out'
            )}
          />
        </button>
      )}
    </Switch>
  )
}
