import { moment } from '@bchouse/utils'
import { cashAddressToLockingBytecode } from '@bitauth/libauth'
import { MockNetworkProvider } from 'cashscript'
import { describe, expect, it } from 'vitest'
import { validateContribution } from '~/server/services/utils/anyonecanpay'
import { fixture } from '~/server/test/fixture'
import { ExitContract } from '../exit/campaign-exit'
import { MainContract } from './campaign-main'

function getInstance() {
  const provider = new MockNetworkProvider()

  const exitContract = new ExitContract(provider, {
    expires: moment().unix(),
    platformAddress: fixture.platform.address,
  })

  const mainContract = new MainContract(provider, {
    amount: BigInt(10000),
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

describe('v0.1 main contract', () => {
  it('should succeed completing campaign', async () => {
    const { mainContract } = getInstance()

    const expectedLockingBytecode = cashAddressToLockingBytecode(
      fixture.campaign.payoutAddress
    )

    expect(
      mainContract.complete({
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 60000n,
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
      //Expect output to be inputs - 1000sats
      //Expect output to be mainContract payout address
      outputs: [
        {
          lockingBytecode:
            typeof expectedLockingBytecode === 'string'
              ? expectedLockingBytecode
              : expectedLockingBytecode.bytecode,
          valueSatoshis: 10000n,
        },
      ],
    })
  })

  it('should succeed completing campaign with anyonecanpay', async () => {
    const { mainContract } = getInstance()

    const expectedLockingBytecode = cashAddressToLockingBytecode(
      fixture.campaign.payoutAddress
    )

    const pledge = {
      //address: 'bitcoincash:qpn7qf6tacxa3xj5khst3e5h9hxanjyzyukc6y2t0x',
      lockingScript: '76a91467e0274bee0dd89a54b5e0b8e6972dcdd9c8822788ac',
      satoshis: 6000n,
      seqNum: BigInt(0xffffffff),
      txid: '09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198',
      unlockingScript:
        '47304402201c0fdc7ecb6892430ffda62780290baa4200ce88a27458c3cb6997fc5ff3798f02205f6627ed8fba45162a17345c2b2d96ff4e50779b3e21daad0a92f8ba34f50c17c12102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b',
      vout: 0,
    }

    //Just to be sure before sending to contract
    expect(
      validateContribution(
        {
          txHash: pledge.txid,
          txIndex: pledge.vout,
          satoshis: Number(pledge.satoshis),
          seqNum: Number(pledge.seqNum),
          lockingScript: pledge.lockingScript,
          unlockingScript: pledge.unlockingScript,
        },
        [
          {
            address: fixture.campaign.payoutAddress,
            satoshis: 10000,
          },
        ]
      )
    ).toBeTruthy()

    expect(
      mainContract.complete(
        {
          campaignUtxo: {
            categoryId: fixture.scenario.success.campaignUtxo.categoryId,
            satoshis: 6000n,
            txid: fixture.scenario.success.campaignUtxo.txid,
            vout: 0,
          },
        },
        [pledge]
      )
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
        {
          outpointIndex: 0,
          outpointTransactionHash: Uint8Array.from(
            Buffer.from(pledge.txid, 'hex')
          ),
          sequenceNumber: expect.anything(),
          unlockingBytecode: expect.anything(),
        },
      ]),
      //Expect output to be inputs - 1000sats
      //Expect output to be mainContract payout address
      outputs: [
        {
          lockingBytecode:
            typeof expectedLockingBytecode === 'string'
              ? expectedLockingBytecode
              : expectedLockingBytecode.bytecode,
          valueSatoshis: 10000n,
        },
      ],
    })
  })
})
