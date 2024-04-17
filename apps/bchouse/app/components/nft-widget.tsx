import { Bars3Icon } from '@heroicons/react/20/solid'
import { SimpleWidget } from '~/components/layouts/widget'
import { classNames } from '~/utils/classNames'
import { trpc } from '~/utils/trpc'
import { useCurrentUser } from './context/current-user-context'
import { useWalletConnectSession } from './utils/wc2-provider'
export function NFTWidget() {
  //TODO: show some nfts to display if wallet connected and user signs
  const { session, setOpen: openWalletConnect } = useWalletConnectSession()
  const user = useCurrentUser()

  const { data = [], isLoading } = trpc.profile.nfts.useQuery(
    {
      address: user.bchAddress,
    },
    {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
      enabled: !!(user && !user.isAnonymous && user.bchAddress && session),
    }
  )

  if (!user || user.isAnonymous) return null

  const nft = data[0]

  return (
    <SimpleWidget
      title="Your NFTs"
      className="pb-2"
      isLoading={isLoading}
      isEmpty={!nft}
    >
      {nft ? (
        <div className="px-4">
          {nft.name ? (
            <div className="text-readable font-semibold">
              <span>{nft.name}</span>
            </div>
          ) : null}
          {nft.attributes ? (
            <div className="py-1">
              <ul className="text-xs text-readable truncate">
                {Object.entries(nft.attributes).map(([name, value]) => (
                  <>
                    <li className="dot-separator-xs inline-block mr-1">
                      <span>{value}</span>
                    </li>
                  </>
                ))}
              </ul>
            </div>
          ) : null}
          {nft.image ? (
            <div className="py-2 flex justify-center items-center">
              <div className="relative">
                <img className="rounded-lg" src={nft.image} />
                <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center px-2 text-sm bg-gray-700 hover:bg-gray-600 text-primary-text">
                  <Bars3Icon className="w-8 h-8" />
                </button>
              </div>
            </div>
          ) : null}
          {/* {nft.description ? (
            <div className="text-sm text-readable line-clamp-4">
              <span>{nft.description}</span>
            </div>
          ) : null} */}
        </div>
      ) : null}
      <div className="p-4 pb-2 flex">
        <button
          onClick={async () => {
            //TODO: add query to tell if current user's address is signed/proved
            const isVerified = true
            if (!session) {
              openWalletConnect(true)
            } else if (!user.bchAddress) {
              //TODO: send request for address
            } else if (!isVerified) {
              //TODO: sign a message given by server to prove address
            } else {
              // await getAddressTokens(networkProvider, user.bchAddress)
            }
          }}
          className={classNames(
            'ml-auto inline-flex items-center justify-center rounded-full border border-transparent bg-purple-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-primary-btn-500 focus:ring-offset-2'
          )}
        >
          {/* TODO: prompt to connect wallet and/or sign address to prove ownership */}
          {/* or simply say, verify nfts */}
          {!session ? 'Connect wallet' : 'Import NFTs'}
        </button>
      </div>
    </SimpleWidget>
  )
}
