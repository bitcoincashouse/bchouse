import { describe } from 'vitest'
import { SearchService } from './search'

function getInstance() {
  const service = new SearchService()

  return {
    service,
  }
}

describe('campaign service', () => {})
