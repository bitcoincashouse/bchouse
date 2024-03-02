import { MockNetworkProvider } from 'cashscript'
import { describe, expect, it } from 'vitest'
import moment from '~/services/utils/moment'
import { fixture } from '~/test/fixture'
import { MainContract } from '../main/campaign-main'
import { ExitContract } from './campaign-exit'

function getInstance() {
  const provider = new MockNetworkProvider()

  const exitContract = new ExitContract(provider, {
    expires: moment().unix(),
    platformAddress: fixture.platform.address,
  })

  const mainContract = new MainContract(provider, {
    amount: BigInt(1000),
    expires: moment().unix(),
    network: 'mainnet',
    payoutAddress: fixture.campaign.payoutAddress,
    platformAddress: fixture.platform.address,
  })

  return {
    provider,
    exitContract,
    mainContract,
  }
}

describe('v0.1 exit contract', () => {
  it('should succeed refunding before expiration', async () => {
    const { exitContract, mainContract } = getInstance()

    expect(
      exitContract.refundBeforeExpiration({
        platformKeys: {
          privKey: fixture.platform.privKey,
          pubKey: fixture.platform.pubKey,
        },
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 5000n,
          txid: fixture.scenario.success.campaignUtxo.txid,
          vout: 0,
        },
        returnAddress: fixture.pledge.refundAddress,
        forwardedUtxo: {
          pledgedAmount: 4000n,
          satoshis: 783n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: 1,
        },
        mainContract,
      })
    ).resolves.toMatchObject({
      campaignUtxo: {
        satoshis: 1000n,
      },
      refundedUtxo: {
        satoshis: 2000n,
      },
    })

    expect(
      exitContract.refundBeforeExpiration({
        platformKeys: {
          privKey: fixture.platform.privKey,
          pubKey: fixture.platform.pubKey,
        },
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 10000n,
          txid: fixture.scenario.success.campaignUtxo.txid,
          vout: 0,
        },
        returnAddress: fixture.pledge.refundAddress,
        forwardedUtxo: {
          pledgedAmount: 4000n,
          satoshis: 783n,
          txid: fixture.scenario.success.campaignUtxo.txid,
          vout: 1,
        },
        mainContract,
      })
    ).resolves.toMatchObject({
      campaignUtxo: {
        satoshis: 6000n,
      },
      refundedUtxo: {
        satoshis: 2000n,
      },
    })
  })
})
