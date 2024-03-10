import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import { Fragment, useMemo } from 'react'
import { classnames } from '../../utils/classnames'

const postTypes = [
  {
    name: 'Post',
    id: 'post',
    icon: IconOne,
  },
  {
    name: 'Campaign',
    id: 'campaign',
    members: 1,
    icon: IconTwo,
  },
] as const

export type PostType = (typeof postTypes)[number]['id']
export function PostTypeDropdown({
  postType = 'post',
  onChange,
}: {
  postType?: PostType
  onChange: (postType: PostType) => void
}) {
  const selectedIndex = useMemo(() => {
    return postTypes.findIndex((type) => type.id === postType) || 0
  }, [postType])

  const selectedValue = postTypes[selectedIndex] || postTypes[0]
  const isPost = selectedValue.name === 'Post'

  return (
    <div>
      <Listbox
        value={selectedIndex}
        onChange={(val) => {
          const selected = postTypes[val] || postTypes[0]
          onChange(selected.id)
        }}
      >
        {({ open }) => (
          <div className="relative inline-block">
            <Listbox.Button
              className={classnames(
                open ? '' : 'text-opacity-90',
                'inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-sm font-bold ring-1 ring-inset ring-gray-200 dark:ring-gray-700',
                isPost ? 'text-orange-400' : 'text-[#0ac18e]'
              )}
            >
              <span>{selectedValue.name}</span>
              <ChevronDownIcon
                className={classnames(
                  open ? '' : 'text-opacity-70',
                  isPost ? 'text-orange-400' : 'text-[#0ac18e]',
                  'h-5 w-5 transition duration-150 ease-in-out group-hover:text-opacity-80'
                )}
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
                  <div className="relative grid gap-8 bg-primary p-6">
                    {postTypes.map((item, i) => (
                      <Listbox.Option
                        key={item.name}
                        value={i}
                        className={classnames(
                          isPost
                            ? 'focus-visible:ring-orange-500'
                            : 'focus-visible:ring-[#0ac18e]',
                          '-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-hover focus:outline-none focus-visible:ring focus-visible:ring-opacity-50'
                        )}
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
                          className={`flex-grow justify-end inset-y-0 left-0 flex items-center ${
                            isPost ? 'text-amber-600' : 'text-[#0ac18e]'
                          } ml-2 ${
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
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 48 48"
      strokeWidth={1}
      stroke="transparent"
      width="48"
      height="48"
    >
      <rect width="48" height="48" rx="8" fill="#E1F8E1" />
      <g transform="translate(6,6) scale(1.5)">
        <path
          d="m 14.636572,19.98607 -0.704591,-2.19406 -0.728948,0.23222 0.70459,2.19406 -1.457898,0.464439 -0.70459,-2.194059 -3.6221494,1.153899 -0.329857,-2.278224 0.786536,-0.250566 c 0.644391,-0.205282 0.814825,-0.940636 0.615246,-1.562117 L 7.1224076,9.0979895 C 6.9281906,8.493207 6.4415196,8.191271 5.8000446,8.3956242 L 4.6082126,8.7753037 3.9087516,6.597216 7.5534966,5.4361175 6.8540356,3.2580301 8.3119336,2.7935906 9.0113946,4.9716781 9.7403436,4.7394584 9.0408826,2.5613711 10.498782,2.0969316 11.2106,4.3134986 c 3.179456,-0.896028 4.806436,-0.1058338 5.593557,1.1191761 0.931065,1.4480561 0.310238,3.1103891 -0.486759,3.7212211 1.183218,-0.07122 2.956541,0.2513948 3.553182,2.1093042 0.812074,2.52876 -0.603394,4.846791 -4.475571,6.080344 l 0.699461,2.178087 z m -3.295038,-7.758456 1.167167,3.6345 c 2.893198,-0.92168 4.78778,-1.825346 4.288598,-3.379774 -0.535323,-1.666962 -2.722206,-1.125551 -5.455765,-0.254726 z M 10.876626,10.77991 C 12.488332,10.266474 14.906331,9.3713291 14.359819,7.6695166 13.893512,6.2174583 12.262179,6.3369963 9.7108556,7.1497653 Z"
          stroke="#0ac18e"
          strokeLinecap="round"
          strokeLinejoin="round"
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
      stroke="transparent"
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
