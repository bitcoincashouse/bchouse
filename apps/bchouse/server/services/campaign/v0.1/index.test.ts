import { MockNetworkProvider } from 'cashscript'
import { describe } from 'vitest'
import moment from '~/server/utils/moment'
import { CampaignContract } from './index'

function getInstance() {
  const provider = new MockNetworkProvider()

  const campaignContract = new CampaignContract(provider, {
    amount: BigInt(1000),
    expires: moment().unix(),
    network: 'mainnet',
    payoutAddress: 'bitcoincash:qzqw4nskjvwlcdj7u9t0lp08c0eyp0hxsyldlhg2nq',
  })

  return {
    provider,
    campaignContract,
  }
}

describe('v1 campaign contract', () => {})
