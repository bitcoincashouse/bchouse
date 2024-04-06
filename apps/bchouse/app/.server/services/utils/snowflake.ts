const DEFAULTS = {
  WORKER_ID: 0,
  EPOCH: 1597017600000, // August 10, 2020 at 00:00:00 UTC
}

const CONFIG = {
  TIMESTAMP_BITS: 42,
  WORKER_ID_BITS: 10,
  SEQUENCE_BITS: 12,
}

const waitUntilNextTimestamp = (currentTimestamp: number) => {
  let nextTimestamp = Date.now()
  while (nextTimestamp <= currentTimestamp) {
    nextTimestamp = Date.now()
  }
  return nextTimestamp
}

const maxSequence = (1 << CONFIG.SEQUENCE_BITS) - 1

export class Snowflake {
  workerId: number
  epoch: number
  lastTimestamp: number
  sequence: number

  constructor({ workerId = DEFAULTS.WORKER_ID, epoch = DEFAULTS.EPOCH } = {}) {
    const currentTimestamp = Date.now()
    if (this.epoch > currentTimestamp) {
      throw new Error(
        `Invalid epoch: ${this.epoch}, it can't be greater than the current timestamp!`
      )
    }

    this.workerId = workerId
    this.epoch = epoch
    this.lastTimestamp = -1
    this.sequence = 0
  }

  generateId() {
    let timestamp = Date.now()

    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock is moving backwards!')
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & maxSequence
      if (this.sequence === 0) {
        //Wait until next timestamp
        let nextTimestamp = Date.now()
        while (nextTimestamp <= timestamp) {
          nextTimestamp = Date.now()
        }
        timestamp = nextTimestamp
      }
    } else {
      this.sequence = 0
    }

    this.lastTimestamp = timestamp

    const timestampOffset = timestamp - this.epoch
    const timestampBits = timestampOffset
      .toString(2)
      .padStart(CONFIG.TIMESTAMP_BITS, '0')
    const workerIdBits = this.workerId
      .toString(2)
      .padStart(CONFIG.WORKER_ID_BITS, '0')
    const sequenceBits = this.sequence
      .toString(2)
      .padStart(CONFIG.SEQUENCE_BITS, '0')

    const idBinary = `${timestampBits}${workerIdBits}${sequenceBits}`
    const idDecimal = BigInt('0b' + idBinary).toString()

    return {
      id: idDecimal.toString(),
    }
  }

  parseId(id: string) {
    return {
      timestamp: 0,
      workerId: 0,
      sequence: 0,
    }
  }
}
