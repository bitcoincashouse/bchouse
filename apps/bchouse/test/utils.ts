import { db } from '../server/db'
import { fixture } from './fixture'

export async function clearDb() {
  await Promise.all([
    db.deleteFrom('User').execute(),
    db.deleteFrom('Campaign').execute(),
    db.deleteFrom('CampaignContractSpendTransaction').execute(),
    db.deleteFrom('CampaignNFT').execute(),
    db.deleteFrom('CircleMembership').execute(),
    db.deleteFrom('Follows').execute(),
    db.deleteFrom('Hashtag').execute(),
    db.deleteFrom('Invite').execute(),
    db.deleteFrom('InviteCode').execute(),
    db.deleteFrom('Likes').execute(),
    db.deleteFrom('Media').execute(),
    db.deleteFrom('Mention').execute(),
    db.deleteFrom('PledgePayment').execute(),
    db.deleteFrom('PledgeRequest').execute(),
    db.deleteFrom('Post').execute(),
    db.deleteFrom('PostPaths').execute(),
    db.deleteFrom('ReportedPosts').execute(),
    db.deleteFrom('Reposts').execute(),
    db.deleteFrom('TipPayment').execute(),
    db.deleteFrom('TipRequest').execute(),
    db.deleteFrom('UploadRequest').execute(),
    db.deleteFrom('User').execute(),
  ])
}

export async function addTestUser() {
  const testuser = fixture.user.testuser

  await db
    .insertInto('User')
    .values({
      id: testuser.id,
      username: testuser.username,
      updatedAt: testuser.updatedAt,
    })
    .execute()
}

export async function addCampaign() {
  await db
    .insertInto('Campaign')
    .values({
      id: fixture.campaign.campaignId,
      network: 'mainnet',
      address: fixture.campaign.payoutAddress,
      campaignerId: fixture.user.testuser.id,
      donationAddress: fixture.campaign.donationAddress,
      expires: fixture.campaign.expires,
      satoshis: fixture.campaign.goal,
      version: 0,
    })
    .execute()
}

export async function addPledgeRequest() {
  await db
    .insertInto('PledgeRequest')
    .values({
      id: fixture.pledge.requestId,
      campaignId: fixture.campaign.campaignId,
      network: 'mainnet',
    })
    .execute()
}
