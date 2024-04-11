import path from 'node:path'
import { Runner } from '../run'

export const cashscript: Runner = {
  name: 'cashscript',
  run: (parameters) => {
    const file = parameters?.file
    if (file) {
      const run = [
        'cashc',
        file,
        '--output',
        path.resolve(path.dirname(file), 'contract.json'),
      ]
      return run
    }

    return [
      'npx',
      'foreach',
      '-g',
      'app/.server/**/*.cash',
      '-x',
      'cashc #{path} --output #{dir}/contract.json',
    ]
  },
  pattern: ['**/*.cash'],
}
