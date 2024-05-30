import { PostCardModel } from '~/.server/services/types'
import { ClientOnly } from '~/components/client-only'
import { DonationWidget } from '~/components/donation-widget'
import { CampaignSubscription } from '~/routes/api+/campaign.subscribe.$campaignId'
import { usePledgeModal } from './hooks/usePledge'

export function CampaignDonationWidget({ post }: { post: PostCardModel }) {
  const { pledge, openPledgeModal } = usePledgeModal(post)

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
