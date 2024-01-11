import dotenv from 'dotenv'
import { resolve } from 'path'
import type { Environment } from 'vitest'

dotenv.config({
  path: resolve(__dirname, '../_test.env'), // my env file that i'm using
})

export default <Environment>{
  name: 'custom',
  transformMode: 'ssr',
  setup() {
    // custom setup
    return {
      teardown() {
        // called after all tests with this env have been run
      },
    }
  },
}
