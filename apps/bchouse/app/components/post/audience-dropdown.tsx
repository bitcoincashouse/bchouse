import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import { Fragment, useMemo } from 'react'

const audiences = [
  {
    name: 'Everyone',
    id: 'everyone',
    icon: IconOne,
  },
  {
    name: 'Your Circle',
    id: 'circle',
    members: 1,
    icon: IconTwo,
  },
] as const

export type AudienceType = (typeof audiences)[number]['id']
export function AudienceDropdown({
  audienceType = 'everyone',
  onChange,
}: {
  audienceType?: AudienceType
  onChange: (audienceType: AudienceType) => void
}) {
  const selectedIndex = useMemo(() => {
    return audiences.findIndex((audience) => audience.id === audienceType) || 0
  }, [audienceType])

  const selectedValue = audiences[selectedIndex] || audiences[0]

  return (
    <div>
      <Listbox
        value={selectedIndex}
        onChange={(val) => {
          const selected = audiences[val] || audiences[0]
          onChange(selected.id)
        }}
      >
        {({ open }) => (
          <div className="relative inline-block">
            <Listbox.Button
              className={`
                ${open ? '' : 'text-opacity-90'}
                inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-sm font-bold ring-1 ring-inset ring-gray-200 text-orange-400`}
            >
              <span>{selectedValue.name}</span>
              <ChevronDownIcon
                className={`${open ? '' : 'text-opacity-70'}
                  h-5 w-5 text-orange-400 transition duration-150 ease-in-out group-hover:text-opacity-80`}
                aria-hidden="true"
              />
            </Listbox.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Listbox.Options className="absolute left-1/2 z-10 mt-3 max-w-sm transform px-4 sm:px-0">
                <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="relative grid gap-8 bg-primary p-7">
                    {audiences.map((item, i) => (
                      <Listbox.Option
                        key={item.name}
                        value={i}
                        className="-m-3 flex items-center rounded-lg py-2 transition duration-150 ease-in-out hover:bg-hover focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center text-white sm:h-12 sm:w-12">
                          <item.icon aria-hidden="true" />
                        </div>
                        <div className="ml-4 shrink-0">
                          <p className="text-sm font-medium text-primary-text">
                            {item.name}
                          </p>
                        </div>
                        <span
                          className={`flex-grow justify-end inset-y-0 left-0 flex items-center text-amber-600 ml-2 ${
                            selectedIndex === i ? 'visible' : 'invisible'
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </Listbox.Option>
                    ))}
                  </div>
                </div>
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
    </div>
  )
}

function IconTwo() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="8" fill="#FFEDD5" />
      <g transform="translate(6,6) scale(1.5)">
        <path
          stroke="#FDBA74"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </g>
    </svg>
  )
}

function IconOne() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 48 48"
      strokeWidth={1.5}
      stroke="currentColor"
      width="48"
      height="48"
    >
      <rect width="48" height="48" rx="8" fill="#FFEDD5" />
      <g transform="translate(6,6) scale(1.5)">
        <path
          stroke="#FB923C"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
        />
      </g>
    </svg>
  )
}
