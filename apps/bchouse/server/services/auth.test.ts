import { describe } from 'vitest'
import { AuthService } from './auth'

function getInstance() {
  const service = new AuthService()

  return {
    service,
  }
}

describe('auth service', () => {})
