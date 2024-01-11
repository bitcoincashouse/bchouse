import { QrCodeIcon } from '@heroicons/react/24/outline'
import { isMainnetAddress, isTestnetAddress } from 'bchaddrjs'
import { useState } from 'react'
import { cn } from '~/utils/cn'
import { AddressInput } from '../components/AddressInput'
import { WCButton } from '../components/Button'
import { Content } from '../components/ModalContent'
import { WCHeader } from '../components/ModalHeader'
import { QrScanner } from '../components/QrScanner'
import { WCText } from '../components/Text'
import { ToastCtrl } from '../core/controllers/ToastCtrl'
import { WalletNetwork } from '../core/types/controllerTypes'
import { SvgUtil } from '../utils/SvgUtil'

export function ManualAddressView({
  isError = false,
  onGoBack,
  showBackBtn = false,
  onAddressChange,
  title = 'Scan or paste your address',
  defaultNetwork,
  allowNetworkChange = false,
  networks,
}: {
  defaultNetwork: WalletNetwork
  networks?: readonly WalletNetwork[]
  allowNetworkChange?: boolean
  onAddressChange: (address: string, network: WalletNetwork) => void
  title?: string
  isError?: boolean
  onGoBack?: () => void
  showBackBtn?: boolean
}) {
  const [address, setAddress] = useState('')
  const [network, setNetwork] = useState<WalletNetwork>(defaultNetwork)
  const [useScanner, setUseScannner] = useState(false)

  function handleAddressChange(address: string) {
    try {
      if (
        network === 'mainnet'
          ? isMainnetAddress(address)
          : isTestnetAddress(address)
      ) {
        setAddress(address)
        return true
      } else {
        ToastCtrl.openToast('Invalid address', 'error')
      }
    } catch (err) {
      ToastCtrl.openToast('Invalid address', 'error')
    }
    return false
  }

  return (
    <div className="wcm-desktop-connecting-view">
      <WCHeader
        title={title}
        showBackBtn={showBackBtn}
        onGoBack={onGoBack}
        onAction={() => setUseScannner(true)}
        actionIcon={SvgUtil.SCAN_ICON}
      ></WCHeader>
      <Content mainClassName={cn('flex flex-col justify-center gap-3 !pb-2')}>
        {/* TODO: Add a list of previously used addresses */}
        {/* Or allow viewing history */}
        <AddressInput
          networks={networks}
          network={network}
          address={address}
          onNetworkChange={(network) => {
            setAddress('')
            setNetwork(network)
          }}
          onAddressChange={(address) => handleAddressChange(address)}
          allowNetworkChange={allowNetworkChange}
        ></AddressInput>

        {/* TODO: Add a list of previously used addresses */}
        {/* Or allow viewing history */}
        {/* TODO: if valid maybe just move on to next screen */}
        <div className={cn('flex flex-col justify-center gap-3')}>
          <div
            className={cn(
              'flex flex-col gap-2 justify-center items-center !text-gray-400 border-[#e5e7eb] p-4 pb-0'
            )}
          >
            <div
              className={cn(
                !useScanner
                  ? 'border-4 border-dashed rounded-2xl aspect-[4/3] relative'
                  : ''
              )}
              onClick={() => setUseScannner(true)}
            >
              <QrScanner
                onScanSuccess={(address) => {
                  if (handleAddressChange(address)) {
                    setUseScannner(false)
                  }
                }}
                pause={!useScanner || !!address}
              />
              {!useScanner ? (
                <div className="flex flex-col justify-center items-center absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
                  <QrCodeIcon className="w-20 h-20 " />
                  <WCText color="secondary" variant="small-thin">
                    Click to scan
                  </WCText>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {useScanner ? (
          <WCButton
            onClick={() => setUseScannner(false)}
            iconLeft={SvgUtil.CROSS_ICON}
            variant="outline"
          >
            Cancel
          </WCButton>
        ) : (
          <WCButton
            onClick={() => onAddressChange(address, network)}
            disabled={!address}
            iconLeft={SvgUtil.CHECKMARK_ICON}
          >
            Done
          </WCButton>
        )}
      </Content>

      {/* <InfoFooter>
        <WCText color="secondary" variant="small-thin">
          {`Manual address selection is required for ${name}`}
        </WCText>
      </InfoFooter> */}
    </div>
  )
}
