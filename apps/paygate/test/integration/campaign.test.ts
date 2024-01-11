import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { action as createPledgeRequest } from '~/routes/api.payment-request.create'
import { fixture } from '~/test/fixture'
import {
  addCampaign,
  addPledgeRequest,
  addTestUser,
  clearDb,
} from '~/test/utils'
//@ts-ignore
import PaymentProtocol from 'bitcore-payment-protocol'
import { action, loader } from '~/routes/api.payment-request.pay.$requestId.$'
import { PaygateService } from '~/server/services/paygate'

describe('#pledge', () => {
  beforeEach(async () => {
    await clearDb()
    await addTestUser()
    await addCampaign()
    await addPledgeRequest()
  })

  it.sequential('create pledge request', async () => {
    // Run the route action function
    const electrumProvider = vi.fn()

    const response: Response = await createPledgeRequest({
      request: new Request(
        `http://localhost/api/campaign/pledge/${fixture.pledge.requestId}/${fixture.pledge.pledgeAmount}`,
        {
          method: 'POST',
          body: JSON.stringify({
            amount: fixture.pledge.pledgeAmount,
            address: fixture.pledge.refundAddress,
            campaignId: fixture.campaign.campaignId,
          }),
        }
      ),
      params: {
        requestId: fixture.pledge.requestId,
        pledgeAmount: fixture.pledge.pledgeAmount,
        refundAddress: fixture.pledge.refundAddress,
      },
      context: {
        authService: {
          getAuthOptional: vi
            .fn()
            .mockImplementation(() => ({ userId: fixture.user.testuser.id })),
        } as any,
        paygateService: new PaygateService(electrumProvider as any),
        paygateUrl: 'http://localhost',
      } as any,
    })

    expect(response.status).toBe(200) // Expect OK response code

    const result = z
      .object({
        paymentUrl: z.string(),
        requestId: z.string(),
        secret: z.string(),
      })
      .passthrough()
      .safeParse(await response.json())

    expect(result.success).toBeTruthy()

    if (result.success) {
      expect(result.data.paymentUrl).toBe(
        `bitcoincash:?r=http://localhost/api/campaign/pledge/${result.data.requestId}/${fixture.pledge.refundAddress}/${fixture.pledge.pledgeAmount}`
      )
    }
  })

  describe.sequential('#bip70', () => {
    it('request pledge payment request', async () => {
      // Run the route action function

      const electrumProvider = {
        getElectrumProvider: vi.fn().mockImplementation(() => ({})),
      }

      const response: Response = await loader({
        request: new Request(
          `http://localhost/api/campaign/pledge/${fixture.pledge.requestId}/${fixture.pledge.pledgeAmount}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/bitcoincash-paymentrequest',
            },
          }
        ),
        params: {
          requestId: fixture.pledge.requestId,
          pledgeAmount: fixture.pledge.pledgeAmount,
          refundAddress: fixture.pledge.refundAddress,
        },
        context: {
          paygateService: new PaygateService(electrumProvider as any),
        } as any,
      })

      expect(response.status).toBe(200) // Expect OK response code

      const payload = await response.arrayBuffer()
      const request = PaymentProtocol.PaymentRequest.decode(payload)
      const details = PaymentProtocol.PaymentDetails.decode(
        request.serialized_payment_details
      )

      const message = z
        .object({
          network: z.string(),
          outputs: z.array(
            z.object({
              amount: z.coerce.string(),
              script: z.any(),
            })
          ),
          time: z.coerce.number(),
          expires: z.coerce.number(),
          memo: z.string(),
        })
        .parse(details)

      expect(message).toBeDefined()
      expect(message.network).toBe('main')
      expect(message.outputs.length).toBe(1)
      expect(message.outputs[0]?.amount).toBe(fixture.pledge.pledgeAmount)
      //TODO: Something seems very wrong here
      // expect(message.outputs[0]?.script).toBe(addressToBytecode(payoutAddress))
    })

    it('pay pledge payment request', async () => {
      // Run the route action function
      vi.mock('~/server/services/inngest/client.ts')

      const electrumProvider = {
        getElectrumProvider: vi.fn().mockImplementation(() => ({
          sendRawTransaction: vi.fn().mockImplementation(() => {
            return '3fe20652e6685aef92b173fcf1e694ac7f2f59c79b2de144cefc4935e0667dad'
          }),
        })),
      }

      const payment = PaymentProtocol.Payment.encode({
        merchant_data: '',
        transactions: [
          Buffer.from(
            '01000000018ae4d45c98d5fd4469b9895f8f81733a733d33bf07f2303fb214f37fa865ba13040000006441608771f06b6c7f746d37338c453e8e049eece8536b468c108d5c719e1632206bb95ba56ce5702b41bcefc1d655687627751206a0b8e498af7b169a54f01e2dbf4121027f893abf883972048b849ec70e2ac7744f50860498524792243707f83653c289feffffff02102700000000000017a914cef8d28904d7e9ad24f6331538c4a0a877adc6e787c84b0000000000001976a914ee37856144210b41ea076659d1745143b2d5089288ac768e0c00',
            'hex'
          ),
        ],
        refund_to: {
          script: '',
        },
        memo: 'Test memo',
      })

      const response: Response = await action({
        request: new Request(
          `http://localhost/api/campaign/pledge/${fixture.pledge.requestId}/${fixture.pledge.pledgeAmount}`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/bitcoincash-paymentack',
            },
            body: payment.toBuffer(),
          }
        ),
        params: {
          requestId: fixture.pledge.requestId,
          pledgeAmount: fixture.pledge.pledgeAmount,
          refundAddress: fixture.pledge.refundAddress,
          pledgeType: 'STARTING',
        },
        context: {
          paygateService: new PaygateService(electrumProvider as any),
        } as any,
      })

      expect(response.status).toBe(200) // Expect OK response code

      const payload = await response.arrayBuffer()
      const paymentACK = PaymentProtocol.PaymentACK.decode(Buffer.from(payload))

      expect(paymentACK).toBeDefined()
      expect(paymentACK.memo).toBe('Pledge success')
    })
  })

  describe.sequential('#jppv1', () => {
    it('request pledge payment', async () => {
      // Run the route action function

      const electrumProvider = {
        getElectrumProvider: vi.fn().mockImplementation(() => ({})),
      }

      const response: Response = await loader({
        request: new Request(
          `http://localhost/api/campaign/pledge/${fixture.pledge.requestId}/${fixture.pledge.pledgeAmount}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/payment-request',
            },
          }
        ),
        params: {
          requestId: fixture.pledge.requestId,
          pledgeAmount: fixture.pledge.pledgeAmount,
          refundAddress: fixture.pledge.refundAddress,
        },
        context: {
          paygateService: new PaygateService(electrumProvider as any),
        } as any,
      })

      expect(response.status).toBe(200) // Expect OK response code

      const responseStr = await response.json()
      const payload = z
        .object({
          network: z.string(),
          currency: z.string(),
          outputs: z.array(
            z.object({
              address: z.string(),
              amount: z.coerce.string(),
            })
          ),
          time: z.coerce.date(),
          expires: z.coerce.date(),
          memo: z.string(),
          paymentUrl: z.string(),
          paymentId: z.string(),
        })
        .safeParse(responseStr)

      expect(payload.success).toBeTruthy()

      if (payload.success) {
        expect(payload.data.network).toBe('main')
        expect(payload.data.currency).toBe('BCH')
        expect(payload.data.outputs.length).toBe(1)
        expect(payload.data.outputs[0]?.amount).toBe(
          fixture.pledge.pledgeAmount
        )
      }
    })

    it('verify pledge payment', async () => {
      // Run the route action function

      const electrumProvider = {
        getElectrumProvider: vi.fn().mockImplementation(() => ({})),
      }

      const response: Response = await action({
        request: new Request(
          `http://localhost/api/campaign/pledge/${fixture.pledge.requestId}/${fixture.pledge.pledgeAmount}`,
          {
            method: 'POST',
            body: JSON.stringify({
              currency: 'BCH',
              unsignedTransaction:
                '01000000018ae4d45c98d5fd4469b9895f8f81733a733d33bf07f2303fb214f37fa865ba13040000006441608771f06b6c7f746d37338c453e8e049eece8536b468c108d5c719e1632206bb95ba56ce5702b41bcefc1d655687627751206a0b8e498af7b169a54f01e2dbf4121027f893abf883972048b849ec70e2ac7744f50860498524792243707f83653c289feffffff02102700000000000017a914cef8d28904d7e9ad24f6331538c4a0a877adc6e787c84b0000000000001976a914ee37856144210b41ea076659d1745143b2d5089288ac768e0c00',
            }),
            headers: {
              'Content-Type': 'application/verify-payment',
            },
          }
        ),
        params: {
          requestId: fixture.pledge.requestId,
          pledgeAmount: fixture.pledge.pledgeAmount,
          refundAddress: fixture.pledge.refundAddress,
          pledgeType: 'STARTING',
        },
        context: {
          paygateService: new PaygateService(electrumProvider as any),
        } as any,
      })

      expect(response.status).toBe(200) // Expect OK response code

      const responseStr = await response.json()
      const payload = z
        .object({
          payment: z.object({
            currency: z.string(),
            unsignedTransaction: z.string(),
          }),
          memo: z.string(),
        })
        .safeParse(responseStr)

      expect(payload.success).toBeTruthy()

      if (payload.success) {
        expect(payload.data.payment.currency).toBe('BCH')
        expect(payload.data.payment.unsignedTransaction).toBeDefined()
      }
    })

    it('pay pledge', async () => {
      vi.mock('~/server/services/inngest/client.ts')

      // Run the route action function

      const electrumProvider = {
        getElectrumProvider: vi.fn().mockImplementation(() => ({
          sendRawTransaction: vi.fn().mockImplementation(() => {
            return '3fe20652e6685aef92b173fcf1e694ac7f2f59c79b2de144cefc4935e0667dad'
          }),
        })),
      }

      const response: Response = await action({
        request: new Request(
          `http://localhost/api/campaign/pledge/${fixture.pledge.requestId}/${fixture.pledge.pledgeAmount}`,
          {
            method: 'POST',
            body: JSON.stringify({
              currency: 'BCH',
              transactions: [
                '01000000018ae4d45c98d5fd4469b9895f8f81733a733d33bf07f2303fb214f37fa865ba13040000006441608771f06b6c7f746d37338c453e8e049eece8536b468c108d5c719e1632206bb95ba56ce5702b41bcefc1d655687627751206a0b8e498af7b169a54f01e2dbf4121027f893abf883972048b849ec70e2ac7744f50860498524792243707f83653c289feffffff02102700000000000017a914cef8d28904d7e9ad24f6331538c4a0a877adc6e787c84b0000000000001976a914ee37856144210b41ea076659d1745143b2d5089288ac768e0c00',
              ],
            }),
            headers: {
              'Content-Type': 'application/payment',
            },
          }
        ),
        params: {
          requestId: fixture.pledge.requestId,
          pledgeAmount: fixture.pledge.pledgeAmount,
          refundAddress: fixture.pledge.refundAddress,
          pledgeType: 'STARTING',
        },
        context: {
          paygateService: new PaygateService(electrumProvider as any),
        } as any,
      })

      expect(response.status).toBe(200) // Expect OK response code

      const responseStr = await response.json()
      const payload = z
        .object({
          currency: z.string(),
          transactions: z.array(z.string()),
        })
        .safeParse(responseStr)

      expect(payload.success).toBeTruthy()

      if (payload.success) {
        expect(payload.data.currency).toBe('BCH')
        expect(payload.data.transactions.length).toBe(1)
      }
    })
  })

  describe.sequential('#jppv2', () => {
    it('request pledge payment options', async () => {
      // Run the route action function

      const electrumProvider = {
        getElectrumProvider: vi.fn().mockImplementation(() => ({})),
      }

      const response: Response = await loader({
        request: new Request(
          `http://localhost/api/campaign/pledge/${fixture.pledge.requestId}/${fixture.pledge.pledgeAmount}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/payment-options',
              'x-paypro-version': '2',
            },
          }
        ),
        params: {
          requestId: fixture.pledge.requestId,
          pledgeAmount: fixture.pledge.pledgeAmount,
          refundAddress: fixture.pledge.refundAddress,
        },
        context: {
          paygateService: new PaygateService(electrumProvider as any),
        } as any,
      })

      expect(response.status).toBe(200) // Expect OK response code

      const responseStr = await response.json()
      const payload = z
        .object({
          paymentOptions: z.array(
            z.object({
              chain: z.string(),
              currency: z.string(),
              decimals: z.number(),
              estimatedAmount: z.number(),
              network: z.string(),
              requiredFeeRate: z.number(),
              minerFee: z.number(),
              selected: z.boolean(),
            })
          ),
          time: z.coerce.date(),
          expires: z.coerce.date(),
          memo: z.string(),
          paymentUrl: z.string(),
          paymentId: z.string(),
        })
        .safeParse(responseStr)

      expect(payload.success).toBeTruthy()

      if (payload.success) {
        expect(payload.data.paymentOptions.length).toBe(1)
        expect(payload.data.paymentOptions[0]?.network).toBe('mainnet')
        expect(payload.data.paymentOptions[0]?.currency).toBe('BCH')
        expect(payload.data.paymentOptions[0]?.selected).toBe(true)
      }
    })

    it('request pledge payment', async () => {
      // Run the route action function

      const electrumProvider = {
        getElectrumProvider: vi.fn().mockImplementation(() => ({})),
      }

      const response: Response = await action({
        request: new Request(
          `http://localhost/api/campaign/pledge/${fixture.pledge.requestId}/${fixture.pledge.pledgeAmount}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/payment-request',
              'x-paypro-version': '2',
            },
          }
        ),
        params: {
          requestId: fixture.pledge.requestId,
          pledgeAmount: fixture.pledge.pledgeAmount,
          refundAddress: fixture.pledge.refundAddress,
          pledgeType: 'STARTING',
        },
        context: {
          paygateService: new PaygateService(electrumProvider as any),
        } as any,
      })

      expect(response.status).toBe(200) // Expect OK response code

      const responseStr = await response.json()
      const payload = z
        .object({
          network: z.string(),
          chain: z.string(),
          currency: z.string(),
          instructions: z.array(
            z.object({
              type: z.string(),
              outputs: z.array(
                z.object({
                  address: z.string(),
                  amount: z.coerce.string(),
                })
              ),
            })
          ),
          time: z.coerce.date(),
          expires: z.coerce.date(),
          memo: z.string(),
          paymentUrl: z.string(),
          paymentId: z.string(),
        })
        .safeParse(responseStr)

      expect(payload.success).toBeTruthy()

      if (payload.success) {
        expect(payload.data.network).toBe('main')
        expect(payload.data.currency).toBe('BCH')
        expect(payload.data.instructions.length).toBe(1)
        expect(payload.data.instructions[0]?.outputs.length).toBe(1)
        expect(payload.data.instructions[0]?.outputs[0]?.amount).toBe(
          fixture.pledge.pledgeAmount
        )
      }
    })

    it('verify pledge payment', async () => {
      // Run the route action function

      const electrumProvider = {
        getElectrumProvider: vi.fn().mockImplementation(() => ({})),
      }

      const body = JSON.stringify({
        currency: 'BCH',
        transactions: [
          {
            tx: '01000000018ae4d45c98d5fd4469b9895f8f81733a733d33bf07f2303fb214f37fa865ba13040000006441608771f06b6c7f746d37338c453e8e049eece8536b468c108d5c719e1632206bb95ba56ce5702b41bcefc1d655687627751206a0b8e498af7b169a54f01e2dbf4121027f893abf883972048b849ec70e2ac7744f50860498524792243707f83653c289feffffff02102700000000000017a914cef8d28904d7e9ad24f6331538c4a0a877adc6e787c84b0000000000001976a914ee37856144210b41ea076659d1745143b2d5089288ac768e0c00',
          },
        ],
      })

      const response: Response = await action({
        request: new Request(
          `http://localhost/api/campaign/pledge/${fixture.pledge.requestId}/${fixture.pledge.pledgeAmount}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/payment-verification',
              'x-paypro-version': '2',
            },
            body,
          }
        ),
        params: {
          requestId: fixture.pledge.requestId,
          pledgeAmount: fixture.pledge.pledgeAmount,
          refundAddress: fixture.pledge.refundAddress,
          pledgeType: 'STARTING',
        },
        context: {
          paygateService: new PaygateService(electrumProvider as any),
        } as any,
      })

      expect(response.status).toBe(200) // Expect OK response code

      const responseStr = await response.json()
      const payload = z
        .object({
          payment: z.object({
            currency: z.string(),
            transactions: z.array(z.object({ tx: z.string() })),
          }),
          memo: z.string(),
        })
        .safeParse(responseStr)

      expect(payload.success).toBeTruthy()

      if (payload.success) {
        expect(JSON.stringify(payload.data.payment)).toBe(body)
        expect(payload.data.memo).toBe('Valid transaction')
      }
    })

    it('pay pledge', async () => {
      vi.mock('~/server/services/inngest/client.ts')

      // Run the route action function

      const electrumProvider = {
        getElectrumProvider: vi.fn().mockImplementation(() => ({
          sendRawTransaction: vi.fn().mockImplementation(() => {
            return '3fe20652e6685aef92b173fcf1e694ac7f2f59c79b2de144cefc4935e0667dad'
          }),
        })),
      }

      const body = JSON.stringify({
        currency: 'BCH',
        transactions: [
          {
            tx: '01000000018ae4d45c98d5fd4469b9895f8f81733a733d33bf07f2303fb214f37fa865ba13040000006441608771f06b6c7f746d37338c453e8e049eece8536b468c108d5c719e1632206bb95ba56ce5702b41bcefc1d655687627751206a0b8e498af7b169a54f01e2dbf4121027f893abf883972048b849ec70e2ac7744f50860498524792243707f83653c289feffffff02102700000000000017a914cef8d28904d7e9ad24f6331538c4a0a877adc6e787c84b0000000000001976a914ee37856144210b41ea076659d1745143b2d5089288ac768e0c00',
          },
        ],
      })
      const response: Response = await action({
        request: new Request(
          `http://localhost/api/campaign/pledge/${fixture.pledge.requestId}/${fixture.pledge.pledgeAmount}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/payment',
              'x-paypro-version': '2',
            },
            body,
          }
        ),
        params: {
          requestId: fixture.pledge.requestId,
          pledgeAmount: fixture.pledge.pledgeAmount,
          refundAddress: fixture.pledge.refundAddress,
          pledgeType: 'STARTING',
        },
        context: {
          paygateService: new PaygateService(electrumProvider as any),
        } as any,
      })

      expect(response.status).toBe(200) // Expect OK response code
      const responseStr = await response.json()
      const payload = z
        .object({
          currency: z.string(),
          transactions: z.array(z.object({ tx: z.string() })),
        })
        .safeParse(responseStr)

      expect(payload.success).toBeTruthy()

      if (payload.success) {
        expect(JSON.stringify(payload.data)).toBe(body)
      }
    })
  })
})
