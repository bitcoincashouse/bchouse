import { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { useLocation, useParams } from '@remix-run/react'
import { DehydratedState } from '@tanstack/react-query'
import { generateText } from '@tiptap/core'
import { $preload, $useLoaderQuery, createRemixClientUtils } from 'remix-query'
import { z } from 'zod'
import { ClientOnly } from '~/components/client-only'
import { DonationWidget } from '~/components/donation-widget'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { usePledgeModal } from '~/components/pledge-modal'
import { getExtensions } from '~/components/post/form/tiptap-extensions'
import { CampaignThread } from '~/components/threads/campaign'
import { CampaignSubscription } from '~/routes/api+/campaign.subscribe.$campaignId'
import { zx } from '~/utils/zodix'

export const handle = {
  title: 'Post',
  preventScrollRestoration: true,
  preventScrollReset: true,
  skipScrollRestoration: true,
}

export const loader = async (_: LoaderFunctionArgs) => {
  const { statusId } = zx.parseParams(_.params, {
    username: z.string(),
    statusId: z.string(),
  })

  return $preload(_, '/api/post/campaign/:campaignId', {
    campaignId: statusId,
  })
}

export const meta: MetaFunction<typeof loader> = ({
  data,
  location,
  matches,
  params,
}) => {
  const remixQueryClientUtils = data
    ? createRemixClientUtils(
        data as any as { dehydratedState: DehydratedState }
      )
    : window.remixQueryClientUtils

  const { mainPost } = remixQueryClientUtils.getData(
    '/api/post/campaign/:campaignId',
    {
      campaignId: params.statusId as string,
    }
  )!

  const author = mainPost.person.name || mainPost.person.handle
  let content = 'A post on BCHouse by ' + author

  try {
    content =
      mainPost.monetization?.title +
      '\n' +
      generateText(
        mainPost.content,
        getExtensions('Placeholder', () => {})
      ).substring(0, 200)
  } catch (err) {}

  const title = mainPost.person.name
    ? `${mainPost.person.name}'s (@${mainPost.person.handle}) Fundraising Campaign on BCHouse`
    : `${mainPost.person.handle} Fundraising Campaign on BCHouse`

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
  const { username, statusId } = useParams<{
    username: string
    statusId: string
  }>()

  const campaign = $useLoaderQuery('/api/post/campaign/:campaignId', {
    params: {
      campaignId: statusId!,
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })

  const {
    previousCursor = undefined,
    nextCursor = undefined,
    mainPost = undefined,
    ancestors = [],
    children = [],
    donorPosts = [],
  } = campaign.data || {}

  const location = useLocation()
  const { pledge, setPledge } = usePledgeModal()
  const openPledgeModal = () =>
    mainPost?.monetization &&
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

  if (!mainPost) {
    //TODO: handle if undefined
    return null
  }

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
