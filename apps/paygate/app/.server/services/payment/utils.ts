//@ts-ignore
import BCHJS from '@psf/bch-js'
import { appEnv } from 'appEnv'

const bchJs = new BCHJS()

export function buildJppHeader(responseStr: string) {
  const privateKey = bchJs.ECPair.fromWIF(appEnv.JPP_SIGNING_KEY as string)

  const digest = Buffer.from(bchJs.Crypto.sha256(responseStr), 'utf8')
  const signature = bchJs.ECPair.sign(privateKey, digest)

  return {
    digest: digest.toString('base64'),
    'x-signature-type': 'ECC',
    'x-identity': appEnv.BCHOUSE_URL as string,
    'x-signature': signature.toDER().toString('base64'),
    'access-control-allow-origin': '*',
  }
}
