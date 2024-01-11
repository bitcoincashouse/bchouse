type TimespanUnitSingular = 'hour' | 'day' | 'month' | 'year'
type TimespanUnitPlural = 'hours' | 'days' | 'months' | 'years'
type TimespanUnit = TimespanUnitSingular | TimespanUnitPlural

export const SATS_PER_BCH = 100000000

export function withdrawPerBlock(
  bchPerTimespan: number,
  timespan: number,
  timespanUnit: TimespanUnit
) {
  const satsPerTimespan = bchPerTimespan * SATS_PER_BCH

  let timespanInMinutes

  //convert hour | day | month | year to blockspan
  if (timespanUnit === 'hour' || timespanUnit === 'hours') {
    timespanInMinutes = timespan * 60
  } else if (timespanUnit === 'day' || timespanUnit === 'days') {
    timespanInMinutes = timespan * 60 * 24
  } else if (timespanUnit === 'month' || timespanUnit === 'months') {
    timespanInMinutes = timespan * 60 * 24 * 30
  } else if (timespanUnit === 'year' || timespanUnit === 'years') {
    timespanInMinutes = timespan * 60 * 24 * 30 * 12
  } else {
    throw new Error('Invalid timespanUnit')
  }

  const blockspan = timespanInMinutes / 10
  return Math.floor(satsPerTimespan / blockspan)
}
