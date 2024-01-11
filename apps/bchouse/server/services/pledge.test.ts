import { describe, vi } from 'vitest'
import { PledgeService } from './pledge'

function getInstance() {
  const service = new PledgeService(vi.fn() as any)

  return {
    service,
  }
}

describe('pledge service', () => {})
