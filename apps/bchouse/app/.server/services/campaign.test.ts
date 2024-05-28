import { describe, vi } from 'vitest'
import { CampaignService } from './campaign'

function getInstance() {
  const service = new CampaignService(vi.fn() as any, vi.fn() as any)

  return {
    service,
  }
}

describe('campaign service', () => {})
