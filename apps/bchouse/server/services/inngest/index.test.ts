import { describe, vi } from 'vitest'
import { InngestService } from './index'

function getInstance() {
  const service = new InngestService(vi.fn() as any)

  return {
    service,
  }
}

describe('inngest service', () => {})
