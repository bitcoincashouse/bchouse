export const logger = {
  error: (...args: Array<any>) => {
    console.error('ERROR:', ...args)
  },
  warn: (...args: Array<any>) => {
    console.warn('WARN:', ...args)
  },
  info: (...args: Array<any>) => {
    console.info('INFO:', ...args)
  },
}
