import { moment } from '@bchouse/utils'

export const fixture = {
  user: {
    testuser: {
      id: '123-456-789',
      username: 'testuser',
      updatedAt: new Date('2023-12-08T20:28:32.286Z'),
    },
  },
  campaign: {
    campaignId: 'campaignid',
    payoutAddress: 'bitcoincash:qzqw4nskjvwlcdj7u9t0lp08c0eyp0hxsyldlhg2nq',
    donationAddress: 'bitcoincash:qzqw4nskjvwlcdj7u9t0lp08c0eyp0hxsyldlhg2nq',
    expires: moment(new Date('2025-12-08T20:28:32.286Z')).unix(),
    goal: BigInt(10000),
  },
  pledge: {
    requestId: '123',
    pledgeAmount: '10000',
    refundAddress: 'bitcoincash:qzqw4nskjvwlcdj7u9t0lp08c0eyp0hxsyldlhg2nq',
    pledgePayment: {
      txid: '00000',
      vout: 0,
      satoshis: BigInt(10000),
      type: 'STARTED',
    },
  },
}
