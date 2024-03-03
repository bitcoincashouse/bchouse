import { moment } from '@bchouse/utils'
import { MockNetworkProvider } from 'cashscript'
import { describe, expect, it } from 'vitest'
import { fixture } from '~/test/fixture'
import { ExitContract } from '../exit/campaign-exit'
import { MainContract } from '../main/campaign-main'
import { StartContract } from './campaign-start'

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

  const startContract = new StartContract(provider, {
    exitContract,
    mainContract,
    returnAddress: fixture.pledge.refundAddress,
  })

  return {
    provider,
    startContract,
  }
}

describe('v0.0 start contract', () => {
  describe('genesis', () => {
    it('should fail to forward to genesis from vout 0', async () => {
      const { startContract } = getInstance()

      expect(
        startContract.forwardToGenesis({
          pledgeUtxo: {
            satoshis: 5000n,
            txid: fixture.pledge.pledgePayment.txid,
            vout: 0,
          },
        })
      ).rejects.toThrow()
    })

    it('should succeed to forward to genesis from vout 1', async () => {
      const { startContract } = getInstance()

      expect(
        startContract.forwardToGenesis({
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
      const { startContract, provider } = getInstance()

      expect(
        startContract.forwardToNewCampaign({
          pledgeUtxo: {
            satoshis: 5000n,
            txid: fixture.pledge.pledgePayment.txid,
            vout: 1,
          },
        })
      ).rejects.toThrow()
    })

    it('should succeed to create campaign from vout 0', async () => {
      const { startContract, provider } = getInstance()

      expect(
        startContract.forwardToNewCampaign({
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
      })
    })
  })

  describe('pledge', () => {
    it('should succeed to forward to existing campaign', async () => {
      const { startContract } = getInstance()

      //Send 5000n pledge to campaign
      expect(
        startContract.forwardToCampaign({
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
        startContract.forwardToCampaign({
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
