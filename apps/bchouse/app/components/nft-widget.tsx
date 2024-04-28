import { useClerk } from '@clerk/remix'
import { PhotoIcon } from '@heroicons/react/20/solid'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { SimpleWidget } from '~/components/layouts/widget'
import { classNames } from '~/utils/classNames'
import { trpc } from '~/utils/trpc'
import { useCurrentUser } from './context/current-user-context'
import { LoadingIndicator } from './loading'
import { useWalletConnectSession } from './utils/wc2-provider'

const variants = {
  enter: (direction: 'left' | 'right' | 'initial') => {
    if (direction == 'initial') return {}

    return {
      x: direction === 'right' ? '200%' : '-200%',
      y: '-50%',
      opacity: 0,
    }
  },
  center: (direction: 'left' | 'right' | 'initial') => {
    if (direction == 'initial') return {}

    return {
      zIndex: 0,
      x: '-50%',
      y: '-50%',
      opacity: 1,
    }
  },
  exit: (direction: 'left' | 'right' | 'initial') => {
    if (direction == 'initial') return {}

    return {
      zIndex: 0,
      x: direction === 'left' ? '200%' : '-200%',
      y: '-50%',
      opacity: 0,
    }
  },
}

export function NFTWidget() {
  //TODO: show some nfts to display if wallet connected and user signs
  const {
    signClient,
    session,
    address,
    setOpen: openWalletConnect,
  } = useWalletConnectSession()
  const user = useCurrentUser()

  const { data = [], isLoading } = trpc.profile.nfts.useQuery(
    {
      address: address || '',
    },
    {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
      enabled: !!(user && !user.isAnonymous && address && session),
    }
  )

  const [{ index, direction }, setIndex] = useState<{
    index: number
    direction: 'left' | 'right' | 'initial'
  }>({ index: 0, direction: 'initial' })

  const clerk = useClerk()
  const setProfilePicture = useMutation({
    mutationKey: ['setProfilePicture'],
    mutationFn: async (nft: NonNullable<(typeof data)[number]>) => {
      //TODO: Show visual indication that we're setting the image
      //TODO: If the image is an ipfs image, we should fetch before setting.
      if (nft.image) {
        await fetch(nft.image)
          .then((res) => res.blob())
          .then((image) => clerk.user?.setProfileImage({ file: image }))
      }
    },
  })

  if (!user || user.isAnonymous || !session) return null

  const nft = data[index]
  const hasPrevious = index !== 0
  const hasNext = index < data.length - 1

  return (
    <SimpleWidget
      title="Your NFTs"
      className="pb-2"
      isLoading={isLoading}
      isEmpty={!nft}
    >
      {nft ? (
        <div className="px-4 relative">
          <div>
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
                      <li
                        key={name}
                        className="dot-separator-xs inline-block mr-1"
                      >
                        <span>{value}</span>
                      </li>
                    </>
                  ))}
                </ul>
              </div>
            ) : null}
            {nft.image ? (
              <div className="h-[250px] relative">
                {hasPrevious ? (
                  <button
                    className="absolute top-1/2 left-0 z-10"
                    onClick={() =>
                      setIndex(({ index }) => ({
                        index: index - 1,
                        direction: 'left',
                      }))
                    }
                  >
                    <ChevronLeftIcon className="w-6" />
                  </button>
                ) : null}
                <motion.div
                  key={index}
                  variants={variants}
                  custom={direction}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'just', bounce: 0, duration: 0.2 },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 max-w-full max-h-full"
                >
                  {' '}
                  <div className="py-2 flex justify-center items-center">
                    <div className="relative">
                      <div className="h-[250px] w-[250px]">
                        <img className="rounded-lg" src={nft.image} />
                      </div>
                      <button
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center px-2 text-sm bg-gray-700 hover:bg-gray-600 text-primary-text"
                        onClick={() => setProfilePicture.mutate(nft)}
                        disabled={setProfilePicture.isPending}
                      >
                        {setProfilePicture.isPending ? (
                          <LoadingIndicator loadingClassName="w-6 h-6 m-auto" />
                        ) : (
                          <PhotoIcon
                            title="Set as profile image"
                            className="w-8 h-8"
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
                {hasNext ? (
                  <button
                    className="absolute top-1/2 right-0 z-10"
                    onClick={() =>
                      setIndex(({ index }) => ({
                        index: index + 1,
                        direction: 'right',
                      }))
                    }
                  >
                    <ChevronRightIcon className="w-6" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="p-4 pb-2 flex">
        {!session ? (
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
            Connect wallet
          </button>
        ) : null}
      </div>
    </SimpleWidget>
  )
}
