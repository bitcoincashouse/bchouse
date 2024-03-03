import { LoaderFunctionArgs } from '@remix-run/node'
//@ts-ignore
import BCHJS from '@psf/bch-js'
const bchJs = new BCHJS()

export const loader = (_: LoaderFunctionArgs) => {
  const privKey = bchJs.ECPair.fromWIF(process.env.JPP_SIGNING_KEY as string)
  const publicKey = bchJs.ECPair.toPublicKey(privKey)

  try {
    // Make these keys valid for only one hour
    const expirationDate = new Date()
    expirationDate.setHours(expirationDate.getHours() + 1)

    return new Response(
      JSON.stringify({
        owner: _.context.paygateUrl,
        expirationDate: expirationDate.toISOString(),
        validDomains: [_.context.paygateUrl],
        publicKeys: [publicKey.toString('hex')],
      })
    )
  } catch (err) {
    return new Response('Failed', {
      status: 500,
    })
  }
}
