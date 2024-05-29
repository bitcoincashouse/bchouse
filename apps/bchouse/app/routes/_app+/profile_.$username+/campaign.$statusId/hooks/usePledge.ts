import { PostCardModel } from '~/.server/services/types'
import { usePledgeModal as usePledgeModalInternal } from '~/components/pledge-modal'

export function usePledgeModal(post?: PostCardModel) {
  const { pledge, setPledge } = usePledgeModalInternal()
  const openPledgeModal = () =>
    post?.monetization &&
    setPledge({
      campaign: {
        id: post.monetization.campaignId,
        expires: post.monetization.expiresAt,
        campaigner: {
          fullName: post.person.name || post.person.handle,
        },
        recipients: [
          {
            satoshis: post.monetization.amount,
            address: post.monetization.address,
          },
        ],
        network: post.monetization.network,
        raised: post.monetization.raised,
        donationAddress: post.monetization.donationAddress,
        version: post.monetization.version,
      },
    })

  return { pledge, setPledge, openPledgeModal }
}
