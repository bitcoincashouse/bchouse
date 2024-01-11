import { Listbox } from '@headlessui/react'
import { Fragment, useMemo } from 'react'
import { Network, trimPrefix } from '~/utils/bchUtils'
import { cn } from '~/utils/cn'
import { WalletNetwork } from '../core/types/controllerTypes'

const networkPrefixes = [
  { prefix: 'bchtest', network: 'chipnet' },
  { prefix: 'bitcoincash', network: 'mainnet' },
] as const

export function AddressInput({
  onAddressChange,
  onNetworkChange,
  address,
  networks,
  network,
  allowNetworkChange,
  ...props
}: Omit<React.ComponentProps<'input'>, 'onChange'> & {
  networks?: readonly WalletNetwork[]
  address: string
  onAddressChange: (address: string) => void
  onNetworkChange: (network: Network) => void
  allowNetworkChange: boolean
  network: WalletNetwork
}) {
  const allowedNetworkPrefixes = useMemo(() => {
    return networks
      ? networkPrefixes.filter((n) => networks.indexOf(n.network) !== -1)
      : networkPrefixes
  }, [networks])

  const currentNetwork = useMemo(() => {
    return (
      allowedNetworkPrefixes.find((n) => n.network === network) ||
      allowedNetworkPrefixes[0]
    )
  }, [network, allowedNetworkPrefixes])

  if (!currentNetwork) {
    throw new Error('Allowed networks requires mainnet or chipnet')
  }

  return (
    <>
      <div className={cn(props.className, 'wcm-address-input')}>
        <label
          htmlFor="company-website"
          className="block sr-only text-sm font-medium leading-6 text-primary-text"
        >
          Company Website
        </label>
        <div className="mt-2 flex rounded-md shadow-sm w-full">
          <input
            type="text"
            value={address}
            //TODO: error toast about typing address
            onInput={(e) => e.preventDefault()}
            onPaste={(event) => {
              const pastedText = event.clipboardData.getData('text/plain')
              // TODO: only match bitcoincash:addresses (trim ourselves)
              if (pastedText) {
                event.preventDefault()
                const value = trimPrefix(pastedText)
                if (value?.indexOf(':') == -1) {
                  onAddressChange(value)
                }
              }
            }}
            onKeyDown={(event) => {
              // Allow backspace to delete the entire content
              if (event.key === 'Backspace') {
                onAddressChange('')
              }
            }}
            placeholder="Recipient address"
          />
          {allowedNetworkPrefixes.length ? (
            <Listbox
              value={currentNetwork}
              onChange={(value) => onNetworkChange(value.network)}
              disabled={
                !allowNetworkChange || allowedNetworkPrefixes.length === 1
              }
            >
              <Listbox.Button
                as={'span'}
                className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-2 order-first text-secondary-text sm:text-sm relative pointer-cursor"
              >
                {currentNetwork.prefix}
                <Listbox.Options
                  className={
                    'absolute top-8 bg-hover rounded-lg p-2 z-10 pointer-cursor'
                  }
                >
                  {allowedNetworkPrefixes.map((networkPrefix) => (
                    <Listbox.Option
                      key={networkPrefix.network}
                      value={networkPrefix}
                      as={Fragment}
                    >
                      {({ active, selected }) => (
                        <li
                          className={cn(
                            'cursor-pointer',
                            networkPrefix.network === currentNetwork.network
                              ? 'bg-hover-secondary'
                              : '',
                            active ? 'text-primary-text' : '',
                            selected ? 'hidden' : ''
                          )}
                        >
                          {networkPrefix.network}
                        </li>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox.Button>
            </Listbox>
          ) : null}
        </div>
      </div>
    </>
  )
}
