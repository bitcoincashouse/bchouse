import { ElectrumNetworkProvider } from 'cashscript'
import { AbstractCampaignContract, CampaignInfo } from './types'
import { CampaignContract as V01CampaignContract } from './v0.1/index'
import { V0CampaignContract } from './v0/index'

export function getCampaignContract(
  electrumProvider: ElectrumNetworkProvider,
  campaignInfo: CampaignInfo
): AbstractCampaignContract {
  if (campaignInfo.version === 0 || campaignInfo.version === 1) {
    return new V0CampaignContract(electrumProvider, campaignInfo)
  } else if (campaignInfo.version === 2) {
    return new V01CampaignContract(electrumProvider, campaignInfo)
  } else {
    throw new Error('Invalid campaign contract version')
  }
}
