import { Buffer } from 'buffer-polyfill'

export function initGlobals() {
  if (typeof window !== 'undefined') {
    //@ts-ignore
    window.Buffer = Buffer
    if (!Array.prototype.at) {
      Object.defineProperty(Array.prototype, 'at', {
        value: function at(this: any, n: number) {
          n = Math.trunc(n) || 0
          if (n < 0) n += this.length
          if (n < 0 || n >= this.length) return undefined
          return this[n]
        },
        writable: true,
        enumerable: false,
        configurable: true,
      })
    }
  }
}
