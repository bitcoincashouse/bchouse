import { useZxing } from 'react-zxing'
import { trimPrefix } from '~/utils/bchUtils'

export function QrScanner({
  onScanSuccess,
  pause,
}: {
  onScanSuccess: (address: string) => void
  pause?: boolean
}) {
  const { ref } = useZxing({
    onDecodeResult(result) {
      onScanSuccess(trimPrefix(result.getText()))
    },
    paused: pause,
  })

  return (
    <div>
      <video className="rounded-2xl" ref={ref} />
    </div>
  )
}
