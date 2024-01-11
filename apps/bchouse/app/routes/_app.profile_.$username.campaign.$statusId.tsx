import { LoaderArgs, MetaFunction } from '@remix-run/node'
import { useLocation } from '@remix-run/react'
import { generateText } from '@tiptap/core'
import {
  UseDataFunctionReturn,
  typedjson,
  useTypedLoaderData,
} from 'remix-typedjson'
import { z } from 'zod'
import { ClientOnly } from '~/components/client-only'
import { DonationWidget } from '~/components/donation-widget'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { usePledgeModal } from '~/components/pledge-modal'
import { CampaignThread } from '~/components/post/campaign'
import { zx } from '~/utils/zodix'
import { getExtensions } from '../components/post/tiptap-extensions'
import { useLayoutLoaderData } from './_app/route'
import { CampaignSubscription } from './api.campaign.subscribe.$campaignId'

export const handle = {
  title: 'Post',
  preventScrollRestoration: true,
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export const loader = async (_: LoaderArgs) => {
  const { userId } = await _.context.authService.getAuthOptional(_)
  const { statusId: postId } = zx.parseParams(_.params, {
    username: z.string(),
    statusId: z.string(),
  })

  const {
    ancestors,
    previousCursor,
    mainPost,
    donorPosts,
    children,
    nextCursor,
  } = await _.context.postService.getCampaignPostWithChildren(userId, postId)

  //TODO: Fetch parents dynamically
  return typedjson({
    ancestors,
    mainPost,
    children,
    donorPosts,
    nextCursor: nextCursor,
    previousCursor,
  })
}

export const meta: MetaFunction = ({ data, location, matches, params }) => {
  const loaderData = data as UseDataFunctionReturn<typeof loader>
  const author =
    loaderData.mainPost.person.name || loaderData.mainPost.person.handle
  let content = 'A post on BCHouse by ' + author

  try {
    content =
      loaderData.mainPost.monetization?.title +
      '\n' +
      generateText(
        loaderData.mainPost.content,
        getExtensions('Placeholder', () => {})
      ).substring(0, 200)
  } catch (err) {}

  const title = loaderData.mainPost.person.name
    ? `${loaderData.mainPost.person.name}'s (@${loaderData.mainPost.person.handle}) Fundraising Campaign on BCHouse`
    : `${loaderData.mainPost.person.handle} Fundraising Campaign on BCHouse`

  const logoUrl = 'https://bchouse.fly.dev/assets/images/bchouse.png'
  const url = `https://bchouse.fly.dev/profile/${params.username}/campaign/${params.statusId}`
  const author_url = `https://bchouse.fly.dev/profile/${params.username}`

  return [
    { title },
    { name: 'description', content: content },
    { name: 'lang', content: 'en' },
    { name: 'author', content: author },
    { name: 'author_url', content: author_url },
    { name: 'site', content: 'BCHouse' },
    { name: 'canonical', content: url },

    { name: 'og:title', content: title },
    { name: 'og:description', content: content },
    { name: 'og:site_name', content: 'BCHouse' },
    { name: 'og:url', content: url },
    { name: 'og:image:url', content: logoUrl },
    { name: 'og:image:type', content: 'image/png' },
    { name: 'og:image:width', content: 534 },
    { name: 'og:image:height', content: 94 },
    { name: 'og:image:alt', content: 'BCHouse Logo' },

    { name: 'twitter:card', content: content },
    { name: 'twitter:site', content: 'BCHouse' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: content },
    { name: 'twitter:image', content: logoUrl },
  ]
}

export default function Index() {
  const {
    previousCursor,
    nextCursor,
    mainPost,
    ancestors,
    children,
    donorPosts,
  } = useTypedLoaderData<typeof loader>()
  const layoutData = useLayoutLoaderData()
  const location = useLocation()
  const currentUser = !layoutData.anonymousView ? layoutData.profile : undefined
  const { pledge, setPledge } = usePledgeModal()
  const openPledgeModal = () =>
    mainPost.monetization &&
    setPledge({
      campaign: {
        id: mainPost.monetization.campaignId,
        expires: mainPost.monetization.expiresAt,
        campaigner: {
          fullName: mainPost.person.name || mainPost.person.handle,
        },
        recipients: [
          {
            satoshis: mainPost.monetization.amount,
            address: mainPost.monetization.address,
          },
        ],
        network: mainPost.monetization.network,
        raised: mainPost.monetization.raised,
        donationAddress: mainPost.monetization.donationAddress,
        version: mainPost.monetization.version,
      },
    })

  return (
    <StandardLayout
      title={'Campaign'}
      main={
        <>
          <div>
            <div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800 pb-[80vh]">
                <div className="">
                  <CampaignThread
                    key={location.pathname}
                    currentUser={currentUser}
                    ancestorPosts={ancestors}
                    previousCursor={previousCursor}
                    mainPost={mainPost}
                    nextCursor={nextCursor}
                    donorPosts={donorPosts}
                    childPosts={children}
                    isPledgeModalOpen={!!pledge}
                    openPledgeModal={openPledgeModal}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      }
      widgets={[
        <ClientOnly>
          {() =>
            mainPost.monetization ? (
              <CampaignSubscription campaign={mainPost.monetization}>
                {(campaignData) => (
                  <DonationWidget
                    showAmount
                    campaignId={campaignData.campaignId}
                    donationAddress={campaignData.donationAddress}
                    address={campaignData.address}
                    requestedAmount={campaignData.amount}
                    amountRaised={campaignData.raised}
                    contributionCount={campaignData.contributionCount}
                    expiresAt={campaignData.expiresAt}
                    fulfilledAt={campaignData.fulfilledAt}
                    network={campaignData.network}
                    campaignerDisplayName={mainPost.person.name}
                    isLoggedIn={!layoutData.anonymousView}
                    className={`rounded-lg overflow-hidden`}
                    isOpen={!!pledge}
                    onOpen={openPledgeModal}
                  ></DonationWidget>
                )}
              </CampaignSubscription>
            ) : null
          }
        </ClientOnly>,
      ]}
    ></StandardLayout>
  )
}
