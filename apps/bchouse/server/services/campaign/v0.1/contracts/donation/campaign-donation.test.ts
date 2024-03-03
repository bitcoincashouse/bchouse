import { MockNetworkProvider } from 'cashscript'
import { describe, expect, it } from 'vitest'
import moment from '~/server/utils/moment'
import { fixture } from '~/test/fixture'
import { ExitContract } from '../exit/campaign-exit'
import { MainContract } from '../main/campaign-main'
import { DonationContract } from './campaign-donation'

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

  const donationContract = new DonationContract(provider, {
    exitContract,
    mainContract,
  })

  return {
    provider,
    donationContract,
  }
}

describe('v0.1 donation contract', () => {
  describe('genesis', () => {
    it('should fail to forward to genesis from vout 0', async () => {
      const { donationContract } = getInstance()

      expect(
        donationContract.forwardToGenesis({
          pledgeUtxo: {
            satoshis: 5000n,
            txid: fixture.pledge.pledgePayment.txid,
            vout: 0,
          },
        })
      ).rejects.toThrow()
    })

    it('should succeed to forward to genesis from vout 1', async () => {
      const { donationContract } = getInstance()

      expect(
        donationContract.forwardToGenesis({
          pledgeUtxo: {
            satoshis: 5000n,
            txid: fixture.pledge.pledgePayment.txid,
            vout: 1,
          },
        })
      ).resolves.not.toThrow()
    })
  })

  describe('create', () => {
    it('should fail to create campaign from vout 1', async () => {
      const { donationContract, provider } = getInstance()

      expect(
        donationContract.forwardToNewCampaign({
          pledgeUtxo: {
            satoshis: 5000n,
            txid: fixture.pledge.pledgePayment.txid,
            vout: 1,
          },
        })
      ).rejects.toThrow()
    })

    it('should succeed to create campaign from vout 0', async () => {
      const { donationContract, provider } = getInstance()

      expect(
        donationContract.forwardToNewCampaign({
          pledgeUtxo: {
            satoshis: 5000n,
            txid: fixture.pledge.pledgePayment.txid,
            vout: 0,
          },
        })
      ).resolves.toMatchObject({
        campaignUtxo: {
          categoryId: fixture.pledge.pledgePayment.txid,
          satoshis: 3000n,
        },
        forwardedPledge: {
          satoshis: 783n,
        },
        change: undefined,
      })
    })

    it('should fail to create if over pledged', async () => {
      const { donationContract } = getInstance()

      //Send 5000n pledge to campaign
      expect(
        donationContract.forwardToNewCampaign({
          pledgeUtxo: {
            satoshis: 6000n,
            txid: fixture.pledge.pledgePayment.txid,
            vout: 0,
          },
        })
      ).resolves.toMatchObject({
        campaignUtxo: {
          categoryId: fixture.pledge.pledgePayment.txid,
          satoshis: 3000n,
          txid: expect.any(String),
        },
        forwardedPledge: {
          satoshis: 783n,
          txid: expect.any(String),
        },
        change: {
          satoshis: 1000n,
          txid: expect.any(String),
        },
      })
    })
  })

  describe('pledge', () => {
    it('should succeed to forward to existing campaign', async () => {
      const { donationContract } = getInstance()

      //Send 3000n pledge to campaign
      expect(
        donationContract.forwardToCampaign({
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
            satoshis: 3000n,
            txid: fixture.pledge.pledgePayment.txid,
            vout: 1,
          },
        })
      ).resolves.toMatchObject({
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 2000n,
        },
        forwardedPledge: {
          satoshis: 783n,
        },
      })

      //Send 4000n sats to campaign
      expect(
        donationContract.forwardToCampaign({
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
            satoshis: 4000n,
            txid: fixture.pledge.pledgePayment.txid,
            vout: 1,
          },
        })
      ).resolves.toMatchObject({
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 3000n,
        },
        forwardedPledge: {
          satoshis: 783n,
        },
      })
    })

    it('should fail to forward to existing campaign if over pledged', async () => {
      const { donationContract } = getInstance()

      //Send 5000n pledge to campaign
      expect(
        donationContract.forwardToCampaign({
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
          satoshis: 3000n,
          txid: expect.any(String),
        },
        forwardedPledge: {
          satoshis: 783n,
          txid: expect.any(String),
        },
        change: {
          satoshis: 1000n,
          txid: expect.any(String),
        },
      })
    })
  })
})