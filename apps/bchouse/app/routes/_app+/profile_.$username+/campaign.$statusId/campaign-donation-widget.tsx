import { PostCardModel } from '~/.server/services/types'
import { ClientOnly } from '~/components/client-only'
import { DonationWidget } from '~/components/donation-widget'
import { PledgeData } from '~/components/pledge-modal/provider'
import { CampaignSubscription } from '~/routes/api+/campaign.subscribe.$campaignId'

export function CampaignDonationWidget({
  post,
  pledge,
  openPledgeModal,
}: {
  post: PostCardModel
  pledge: PledgeData | null
  openPledgeModal: () => void | undefined
}) {
  return (
    <ClientOnly>
      {() =>
        post.monetization ? (
          <CampaignSubscription campaign={post.monetization}>
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
                campaignerDisplayName={post.person.name}
                className={`rounded-lg overflow-hidden`}
                isOpen={!!pledge}
                onOpen={openPledgeModal}
              ></DonationWidget>
            )}
          </CampaignSubscription>
        ) : null
      }
    </ClientOnly>
  )
}
