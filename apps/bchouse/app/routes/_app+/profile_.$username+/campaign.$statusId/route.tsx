import { LoaderFunctionArgs, MetaFunction } from '@remix-run/node'
import { useLocation, useParams } from '@remix-run/react'
import { $preload, $useLoaderQuery, createRemixClientUtils } from 'remix-query'
import { z } from 'zod'
import { StandardLayout } from '~/components/layouts/standard-layout'
import { ThreadProvider } from '~/components/thread-provider'
import { CampaignThread } from '~/components/threads/campaign-thread/campaign'
import { zx } from '~/utils/zodix'
import { CampaignDonationWidget } from './campaign-donation-widget'
import { createMetaTags } from './createMetaTags'

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
  const queryClient = data
    ? createRemixClientUtils(data)
    : window.remixQueryClientUtils

  const { mainPost } = queryClient.getData('/api/post/campaign/:campaignId', {
    campaignId: params.statusId as string,
  })!

  return createMetaTags(mainPost, params)
}

function useCampaignQuery() {
  const { statusId } = useParams<{
    statusId: string
  }>()

  return $useLoaderQuery('/api/post/campaign/:campaignId', {
    params: {
      campaignId: statusId!,
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!statusId,
  })
}

export default function Index() {
  const campaignQuery = useCampaignQuery()
  const location = useLocation()

  const {
    mainPost = undefined,
    ancestors = [],
    children = [],
  } = campaignQuery.data || {}

  //TODO: handle if undefined
  if (!mainPost) return null

  return (
    <ThreadProvider main={mainPost} ancestors={ancestors} replies={children}>
      <StandardLayout
        title={'Campaign'}
        main={
          <>
            <div>
              <div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800 pb-[80vh]">
                  <div className="">
                    <CampaignThread key={location.pathname} />
                  </div>
                </div>
              </div>
            </div>
          </>
        }
        widgets={[<CampaignDonationWidget post={mainPost} />]}
      ></StandardLayout>
    </ThreadProvider>
  )
}
