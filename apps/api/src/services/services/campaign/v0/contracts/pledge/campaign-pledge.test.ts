import { MockNetworkProvider } from 'cashscript'
import { describe, expect, it } from 'vitest'
import moment from '~/services/utils/moment'
import { fixture } from '~/test/fixture'
import { ExitContract } from '../exit/campaign-exit'
import { MainContract } from '../main/campaign-main'
import { PledgeContract } from './campaign-pledge'

function getInstance() {
  const provider = new MockNetworkProvider()

  const mainContract = new MainContract(provider, {
    amount: BigInt(1000),
    expires: moment().unix(),
    network: 'mainnet',
    payoutAddress: fixture.campaign.payoutAddress,
    platformAddress: fixture.platform.address,
  })

  const exitContract = new ExitContract(provider, {
    expires: moment().unix(),
    platformAddress: fixture.platform.address,
  })

  const pledgeContract = new PledgeContract(provider, {
    exitContract,
    categoryId: fixture.scenario.success.campaignUtxo.categoryId,
    contributorRefundAddress: fixture.pledge.refundAddress,
  })

  return {
    provider,
    pledgeContract,
    mainContract,
  }
}

describe('v0.0 pledge contract', () => {
  describe('pledge', () => {
    it('should succeed to forward to existing campaign', async () => {
      const { pledgeContract, mainContract } = getInstance()

      //Send 5000n pledge to campaign
      expect(
        pledgeContract.forwardToCampaign({
          mainContract,
          platformKeys: {
            privKey: fixture.platform.privKey,
            pubKey: fixture.platform.pubKey,
          },
          campaignUtxo: {
            categoryId: fixture.scenario.success.campaignUtxo.categoryId,
            satoshis: 1000n,
            txid: fixture.scenario.success.campaignUtxo.txid,
            vout: 0,
          },
          pledgeUtxo: {
            satoshis: 5000n,
            txid: fixture.pledge.pledgePayment.txid,
            vout: 1,
          },
        })
      ).resolves.toMatchObject({
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 4000n,
        },
        forwardedPledge: {
          satoshis: 783n,
        },
      })

      //Send 6000n sats to campaign
      expect(
        pledgeContract.forwardToCampaign({
          mainContract,
          platformKeys: {
            privKey: fixture.platform.privKey,
            pubKey: fixture.platform.pubKey,
          },
          campaignUtxo: {
            categoryId: fixture.scenario.success.campaignUtxo.categoryId,
            satoshis: 1000n,
            txid: fixture.scenario.success.campaignUtxo.txid,
            vout: 0,
          },
          pledgeUtxo: {
            satoshis: 6000n,
            txid: fixture.pledge.pledgePayment.txid,
            vout: 1,
          },
        })
      ).resolves.toMatchObject({
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 5000n,
        },
        forwardedPledge: {
          satoshis: 783n,
        },
      })
    })
  })
})
