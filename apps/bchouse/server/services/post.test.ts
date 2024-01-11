import { describe, vi } from 'vitest'

async function getInstance() {
  vi.stubEnv('CLERK_PUBLISHABLE_KEY', 'key')
  vi.stubEnv('STORAGE_ACCESS_KEY', 'key')
  vi.stubEnv('STORAGE_SECRET_KEY', 'key')
  vi.stubEnv('STORAGE_BUCKET', 'bucket')
  vi.stubEnv('STORAGE_PUBLIC_URL', 'http://localhost:8000')
  vi.stubEnv('STORAGE_API_URL', 'http://localhost:8000')

  const { PostService } = await import('./post')

  const service = new PostService(
    vi.fn() as any,
    vi.fn() as any,
    vi.fn() as any
  )

  return {
    service,
  }
}

describe('post service', () => {})
