import { MockNetworkProvider } from 'cashscript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fixture } from '~/server/test/fixture'
import { DonationContract } from './contracts/donation/campaign-donation'
import { MainContract } from './contracts/main/campaign-main'
import { PledgeContract } from './contracts/pledge/campaign-pledge'
import { StartContract } from './contracts/start/campaign-start'

vi.mock('./contracts/pledge/campaign-pledge', () => {
  const PledgeContract = vi.fn()
  return { PledgeContract }
})

vi.mock('./contracts/start/campaign-start', () => {
  const StartContract = vi.fn()
  return { StartContract }
})

vi.mock('./contracts/donation/campaign-donation', () => {
  const DonationContract = vi.fn()
  return { DonationContract }
})

vi.mock('./contracts/main/campaign-main', () => {
  const MainContract = vi.fn()
  return { MainContract }
})

describe('v0 campaign contract', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should complete campaign', async () => {
    MainContract.prototype.complete = vi.fn()
    vi.mock('./contracts/donation/campaign-donation', () => {
      const DonationContract = vi.fn()
      return { DonationContract }
    })

    const provider = new MockNetworkProvider()
    const { V0CampaignContract } = await import('./index')
    const campaignContract = new V0CampaignContract(provider, {
      amount: fixture.campaign.goal,
      expires: fixture.campaign.expires,
      network: fixture.campaign.network,
      payoutAddress: fixture.campaign.payoutAddress,
    })

    expect(
      campaignContract.complete({
        categoryId: fixture.scenario.success.campaignUtxo.categoryId,
        txid: fixture.scenario.success.campaignUtxo.txid,
        vout: 0,
        satoshis: 11000n,
      })
    ).resolves.not.toThrow()

    expect(MainContract.prototype.complete).toBeCalledWith(
      expect.objectContaining({
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          txid: fixture.scenario.success.campaignUtxo.txid,
          vout: 0,
          satoshis: 11000n,
        },
      })
    )
  })

  it('should forward pledge via starting contract', async () => {
    StartContract.prototype.forwardToCampaign = vi.fn()

    const provider = new MockNetworkProvider()
    const { V0CampaignContract } = await import('./index')
    const campaignContract = new V0CampaignContract(provider, {
      amount: fixture.campaign.goal,
      expires: fixture.campaign.expires,
      network: fixture.campaign.network,
      payoutAddress: fixture.campaign.payoutAddress,
    })

    expect(
      campaignContract.forwardPledge(
        '',
        fixture.pledge.refundAddress,
        'STARTING',
        {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: fixture.pledge.pledgePayment.vout,
        },
        {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 0n,
          txid: fixture.scenario.success.campaignUtxo.txid,
          vout: 0,
        }
      )
    ).resolves.not.toThrow()

    expect(StartContract.prototype.forwardToCampaign).toBeCalledWith(
      expect.objectContaining({
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 0n,
          txid: fixture.scenario.success.campaignUtxo.txid,
          vout: 0,
        },
        pledgeUtxo: {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: fixture.pledge.pledgePayment.vout,
        },
        platformKeys: {
          pubKey: expect.any(String),
          privKey: expect.any(String),
        },
      })
    )
  })

  it('should forward pledge via starting contract (w/ move to genesis)', async () => {
    StartContract.prototype.forwardToNewCampaign = vi.fn()
    StartContract.prototype.forwardToGenesis = vi.fn().mockResolvedValue({
      pledgeUtxo: {
        vout: 0,
        txid: 'txid',
        satoshis: 3000n,
      },
    })

    const provider = new MockNetworkProvider()
    const { V0CampaignContract } = await import('./index')
    const campaignContract = new V0CampaignContract(provider, {
      amount: fixture.campaign.goal,
      expires: fixture.campaign.expires,
      network: fixture.campaign.network,
      payoutAddress: fixture.campaign.payoutAddress,
    })

    const onForwardPledge = vi.fn().mockResolvedValue({})

    await expect(
      campaignContract.forwardPledge(
        '',
        fixture.pledge.refundAddress,
        'STARTING',
        {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: 1,
        },
        undefined,
        onForwardPledge
      )
    ).resolves.not.toThrow()

    expect(StartContract.prototype.forwardToGenesis).toBeCalledWith(
      expect.objectContaining({
        pledgeUtxo: {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: 1,
        },
      })
    )

    expect(onForwardPledge).toBeCalledWith({
      vout: 0,
      txid: 'txid',
      satoshis: 3000n,
    })

    expect(StartContract.prototype.forwardToNewCampaign).toBeCalledWith(
      expect.objectContaining({
        pledgeUtxo: {
          satoshis: 3000n,
          txid: 'txid',
          vout: 0,
        },
      })
    )
  })

  it('should forward pledge via starting contract (w/o move to genesis)', async () => {
    StartContract.prototype.forwardToNewCampaign = vi.fn()
    StartContract.prototype.forwardToGenesis = vi.fn()

    const provider = new MockNetworkProvider()
    const { V0CampaignContract } = await import('./index')
    const campaignContract = new V0CampaignContract(provider, {
      amount: fixture.campaign.goal,
      expires: fixture.campaign.expires,
      network: fixture.campaign.network,
      payoutAddress: fixture.campaign.payoutAddress,
    })

    const onForwardPledge = vi.fn().mockResolvedValue({})

    await expect(
      campaignContract.forwardPledge(
        '',
        fixture.pledge.refundAddress,
        'STARTING',
        {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: 0,
        },
        undefined,
        onForwardPledge
      )
    ).resolves.not.toThrow()

    expect(StartContract.prototype.forwardToGenesis).not.toBeCalled()
    expect(onForwardPledge).not.toBeCalled()
    expect(StartContract.prototype.forwardToNewCampaign).toBeCalledWith(
      expect.objectContaining({
        pledgeUtxo: {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: 0,
        },
      })
    )
  })

  it('should forward donation via starting contract', async () => {
    DonationContract.prototype.forwardToCampaign = vi.fn()

    const provider = new MockNetworkProvider()
    const { V0CampaignContract } = await import('./index')
    const campaignContract = new V0CampaignContract(provider, {
      amount: fixture.campaign.goal,
      expires: fixture.campaign.expires,
      network: fixture.campaign.network,
      payoutAddress: fixture.campaign.payoutAddress,
    })

    expect(
      campaignContract.forwardPledge(
        '',
        fixture.pledge.refundAddress,
        'DONATION',
        {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: fixture.pledge.pledgePayment.vout,
        },
        {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 0n,
          txid: fixture.scenario.success.campaignUtxo.txid,
          vout: 0,
        }
      )
    ).resolves.not.toThrow()

    expect(DonationContract.prototype.forwardToCampaign).toBeCalledWith(
      expect.objectContaining({
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 0n,
          txid: fixture.scenario.success.campaignUtxo.txid,
          vout: 0,
        },
        pledgeUtxo: {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: fixture.pledge.pledgePayment.vout,
        },
        platformKeys: {
          pubKey: expect.any(String),
          privKey: expect.any(String),
        },
      })
    )
  })

  it('should forward donation via starting contract (w/ move to genesis)', async () => {
    DonationContract.prototype.forwardToNewCampaign = vi.fn()
    DonationContract.prototype.forwardToGenesis = vi.fn().mockResolvedValue({
      pledgeUtxo: {
        vout: 0,
        txid: 'txid',
        satoshis: 3000n,
      },
    })

    const provider = new MockNetworkProvider()
    const { V0CampaignContract } = await import('./index')
    const campaignContract = new V0CampaignContract(provider, {
      amount: fixture.campaign.goal,
      expires: fixture.campaign.expires,
      network: fixture.campaign.network,
      payoutAddress: fixture.campaign.payoutAddress,
    })

    const onForwardPledge = vi.fn().mockResolvedValue({})

    await expect(
      campaignContract.forwardPledge(
        '',
        fixture.pledge.refundAddress,
        'DONATION',
        {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: 1,
        },
        undefined,
        onForwardPledge
      )
    ).resolves.not.toThrow()

    expect(DonationContract.prototype.forwardToGenesis).toBeCalledWith(
      expect.objectContaining({
        pledgeUtxo: {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: 1,
        },
      })
    )

    expect(onForwardPledge).toBeCalledWith({
      vout: 0,
      txid: 'txid',
      satoshis: 3000n,
    })

    expect(DonationContract.prototype.forwardToNewCampaign).toBeCalledWith(
      expect.objectContaining({
        pledgeUtxo: {
          satoshis: 3000n,
          txid: 'txid',
          vout: 0,
        },
      })
    )
  })

  it('should forward donation via starting contract (w/o move to genesis)', async () => {
    DonationContract.prototype.forwardToNewCampaign = vi.fn()
    DonationContract.prototype.forwardToGenesis = vi.fn()

    const provider = new MockNetworkProvider()
    const { V0CampaignContract } = await import('./index')
    const campaignContract = new V0CampaignContract(provider, {
      amount: fixture.campaign.goal,
      expires: fixture.campaign.expires,
      network: fixture.campaign.network,
      payoutAddress: fixture.campaign.payoutAddress,
    })

    const onForwardPledge = vi.fn().mockResolvedValue({})

    await expect(
      campaignContract.forwardPledge(
        '',
        fixture.pledge.refundAddress,
        'DONATION',
        {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: 0,
        },
        undefined,
        onForwardPledge
      )
    ).resolves.not.toThrow()

    expect(DonationContract.prototype.forwardToGenesis).not.toBeCalled()
    expect(onForwardPledge).not.toBeCalled()
    expect(DonationContract.prototype.forwardToNewCampaign).toBeCalledWith(
      expect.objectContaining({
        pledgeUtxo: {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: 0,
        },
      })
    )
  })

  it('should forward pledge via pledge contract', async () => {
    StartContract.prototype.forwardToCampaign = vi.fn()
    PledgeContract.prototype.forwardToCampaign = vi.fn()

    const provider = new MockNetworkProvider()
    const { V0CampaignContract } = await import('./index')
    const campaignContract = new V0CampaignContract(provider, {
      amount: fixture.campaign.goal,
      expires: fixture.campaign.expires,
      network: fixture.campaign.network,
      payoutAddress: fixture.campaign.payoutAddress,
    })

    expect(
      campaignContract.forwardPledge(
        '',
        fixture.pledge.refundAddress,
        'STARTED',
        {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: fixture.pledge.pledgePayment.vout,
        },
        {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 0n,
          txid: fixture.scenario.success.campaignUtxo.txid,
          vout: 0,
        }
      )
    ).resolves.not.toThrow()

    expect(PledgeContract.prototype.forwardToCampaign).toBeCalledWith(
      expect.objectContaining({
        campaignUtxo: {
          categoryId: fixture.scenario.success.campaignUtxo.categoryId,
          satoshis: 0n,
          txid: fixture.scenario.success.campaignUtxo.txid,
          vout: 0,
        },
        pledgeUtxo: {
          satoshis: 4000n,
          txid: fixture.pledge.pledgePayment.txid,
          vout: fixture.pledge.pledgePayment.vout,
        },
        platformKeys: {
          pubKey: expect.any(String),
          privKey: expect.any(String),
        },
      })
    )
  })
})
