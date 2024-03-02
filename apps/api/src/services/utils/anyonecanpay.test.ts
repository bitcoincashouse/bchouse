import { describe, expect, it } from 'vitest'
import {
  parseCommitmentFromElectronCash,
  validateContribution,
} from './anyonecanpay'

describe('anyonecanpay utils', () => {
  it('should validate correctly', () => {
    expect(
      validateContribution(
        {
          //'bitcoincash:qpn7qf6tacxa3xj5khst3e5h9hxanjyzyukc6y2t0x'
          //privKey: KyeaGGv7PLq7RckE7yrgMg3ovF3ggGSEfHmsedouNK1nAbGfCevD
          //02e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b
          lockingScript: '76a91467e0274bee0dd89a54b5e0b8e6972dcdd9c8822788ac',
          satoshis: 6000000000,
          seqNum: 0xffffffff,
          txHash:
            '09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198',
          txIndex: 0,
          unlockingScript:
            '47304402204006d34e7eed6b020a4067ce667aef82fa06219bce5e2bc3553ed7dffb1eed310220110ee324110a51e5e62b0f48c90fae08de5fd28634184b094005f1884632cb83c12102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b',
        },
        [
          {
            address: 'bitcoincash:qqflp5r0tr8l29y6h5vknpvhuf6hnyy4uuv43aphgu',
            satoshis: 12000000000,
          },
        ]
      )
    ).toBeTruthy()
  })

  it('should parse correctly', () => {
    expect(
      parseCommitmentFromElectronCash(
        Buffer.from(
          JSON.stringify({
            inputs: [
              {
                previous_output_transaction_hash:
                  '09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198',
                previous_output_index: 0,
                sequence_number: 0xffffffff,
                unlocking_script:
                  '47304402204006d34e7eed6b020a4067ce667aef82fa06219bce5e2bc3553ed7dffb1eed310220110ee324110a51e5e62b0f48c90fae08de5fd28634184b094005f1884632cb83c12102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b',
              },
            ],
          })
        ).toString('base64')
      )
    ).toEqual({
      seqNum: 0xffffffff,
      txHash:
        '09298e235de50835d762c2e8975ac154cec293da3524dba0c74b8ec98fc93198',
      txIndex: 0,
      unlockingScript:
        '47304402204006d34e7eed6b020a4067ce667aef82fa06219bce5e2bc3553ed7dffb1eed310220110ee324110a51e5e62b0f48c90fae08de5fd28634184b094005f1884632cb83c12102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b',
    })
  })
})
