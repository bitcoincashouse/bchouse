import { LoaderArgs } from '@remix-run/node'
//@ts-ignore
import BCHJS from '@psf/bch-js'
const bchJs = new BCHJS()

export const loader = (_: LoaderArgs) => {
  const privKey = bchJs.ECPair.fromWIF(process.env.JPP_SIGNING_KEY as string)
  const publicKey = bchJs.ECPair.toPublicKey(privKey)

  try {
    // Make these keys valid for only one hour
    const expirationDate = new Date()
    expirationDate.setHours(expirationDate.getHours() + 1)

    return new Response(
      JSON.stringify({
        owner: _.context.bchouseUrl,
        expirationDate: expirationDate.toISOString(),
        validDomains: [_.context.bchouseUrl],
        publicKeys: [publicKey.toString('hex')],
      })
    )
  } catch (err) {
    return new Response('Failed', {
      status: 500,
    })
  }
}
