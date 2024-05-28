import { moment } from '@bchouse/utils'

export const fixture = {
  platform: {
    address: 'bitcoincash:qrw2xd5vlcn5krmcql8jxntjpd5agf3r5qpkq3atgr',
    privKey: 'L4ceyCQxY5ZKdeVfhYwJRRkwPRUuZDZffXL7PKZfujPZbvzaFc2V',
    pubKey:
      '02bc83d342d24572a4f4fb81bcc71e8abca29028a7de50fd52368233684529e93e',
  },
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
    network: 'chipnet' as const,
  },
  scenario: {
    success: {
      campaignUtxo: {
        txid: 'b04786e2c75f6436baf7b40d3b22b869017b36fa108354dff965b83b86f44707',
        categoryId:
          '9be450136e3e3f1a543fb08dae7515140a5cccbf47e0cb08eb7c5489f1aecaa4',
      },
    },
  },
  pledge: {
    requestId: '123',
    pledgeAmount: '10000',
    refundAddress: 'bitcoincash:qrw2xd5vlcn5krmcql8jxntjpd5agf3r5qpkq3atgr',
    pledgePayment: {
      txid: 'a04786e2c75f6436baf7b40d3b22b869017b36fa108354dff965b83b86f44707',
      vout: 0,
      satoshis: BigInt(10000),
      type: 'STARTED',
    },
  },
  v0: {
    pledgeAddress: 'bchtest:pr80355fqnt7ntfy7ce32wxy5z580twxuupykrp5e7',
    donationAddress: 'bchtest:pzyucm50fnm3tt3ud2uwsdu82f308ys5rsfdafe65h',
  },
}
