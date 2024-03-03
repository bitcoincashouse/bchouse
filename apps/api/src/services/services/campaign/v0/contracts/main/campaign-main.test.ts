import { moment } from '@bchouse/utils'
import { cashAddressToLockingBytecode } from '@bitauth/libauth'
import { MockNetworkProvider } from 'cashscript'
import { describe, expect, it } from 'vitest'
import { fixture } from '~/test/fixture'
import { ExitContract } from '../exit/campaign-exit'
import { MainContract } from './campaign-main'

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

describe('v0.0 main contract', () => {
  it('should succeed completing campaign', async () => {
    const { mainContract } = getInstance()

    const expectedLockingBytecode = cashAddressToLockingBytecode(
      fixture.campaign.payoutAddress
    )

    expect(
      mainContract.complete({
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 5000n,
          txid: fixture.scenario.success.campaignUtxo.txid,
          vout: 0,
        },
      })
    ).resolves.toMatchObject({
      hex: expect.anything(),
      txid: expect.anything(),
      version: expect.anything(),
      //Expect input to match campaign utxo
      inputs: expect.arrayContaining([
        {
          outpointIndex: 0,
          outpointTransactionHash: Uint8Array.from(
            Buffer.from(fixture.scenario.success.campaignUtxo.txid, 'hex')
          ),
          sequenceNumber: expect.anything(),
          unlockingBytecode: expect.anything(),
        },
      ]),
      locktime: 133700,
      //Expect output to be inputs - 1000sats
      //Expect output to be mainContract payout address
      outputs: [
        {
          lockingBytecode:
            typeof expectedLockingBytecode === 'string'
              ? expectedLockingBytecode
              : expectedLockingBytecode.bytecode,
          valueSatoshis: 4000n,
        },
      ],
    })
  })
})
