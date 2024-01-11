import { describe, vi } from 'vitest'
import { FeedService } from './feed'

function getInstance() {
  const service = new FeedService(vi.fn() as any)

  return {
    service,
  }
}

describe('feed service', () => {})
