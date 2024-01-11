import { describe } from 'vitest'
import { RedisService } from './redis'

function getInstance() {
  const service = new RedisService()

  return {
    service,
  }
}

describe('redis service', () => {})
