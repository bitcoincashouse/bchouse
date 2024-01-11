import { describe, vi } from 'vitest'
import { UserService } from './user'

function getInstance() {
  const service = new UserService(vi.fn() as any, vi.fn() as any)

  return {
    service,
  }
}

describe('user service', () => {})
