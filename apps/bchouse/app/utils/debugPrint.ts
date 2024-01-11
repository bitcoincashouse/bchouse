export function debugPrint(...args: any[]) {
  console.log(
    JSON.stringify(
      args,
      (key, val) => {
        if (typeof val === 'bigint') {
          return val.toString()
        }

        return val
      },
      2
    )
  )
}
