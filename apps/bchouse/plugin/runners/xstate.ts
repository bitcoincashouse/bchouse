import { Runner } from '../run'

export const xstate: Runner = {
  name: 'xstate',
  run: (parameters) => {
    const file = parameters?.file
    if (file) {
      return ['npx', 'xstate', 'typegen', file]
    }

    return ['npx', 'xstate', 'typegen', 'app/**/*.machine.ts?(x)']
  },
  pattern: ['**/*.machine.ts?(x)'],
}
