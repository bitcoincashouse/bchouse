import { ElectrumNetworkProvider } from 'cashscript'
import {
  ClusterStatus,
  ElectrumCluster,
  ElectrumTransport,
  TransportScheme,
} from 'electrum-cash'
import { logger } from '~/utils/logger'
import { Network } from '../db/types'

type ElectrumNetwork = {
  provider: ElectrumNetworkProvider
  cluster: ElectrumCluster
}

export class ElectrumNetworkProviderService {
  constructor(
    readonly mainnet: ElectrumNetwork,
    readonly chipnet: ElectrumNetwork
  ) {}

  static async createMainnetNetwork() {
    const mainnetCluster = new ElectrumCluster('mainnet.bchouse.me', '1.4.1', 1)

    await Promise.all([
      // addServer(
      //   mainnetCluster,
      //   'mainnet',
      //   'blackie.c3-soft.com',
      //   50004,
      //   ElectrumTransport.WSS.Scheme
      // ),
      // addServer(
      //   mainnetCluster,
      //   'mainnet',
      //   'electroncash.de',
      //   60002,
      //   ElectrumTransport.WSS.Scheme
      // ),
      // addServer(
      //   mainnetCluster,
      //   'mainnet',
      //   'electroncash.dk',
      //   50004,
      //   ElectrumTransport.WSS.Scheme
      // ),
      // addServer(
      //   mainnetCluster,
      //   'mainnet',
      //   'bch.loping.net',
      //   50004,
      //   ElectrumTransport.WSS.Scheme
      // ),
      addServer(
        mainnetCluster,
        'mainnet',
        'bch.imaginary.cash',
        50004,
        ElectrumTransport.WSS.Scheme
      ),
    ])

    const mainnetProvider = new ElectrumNetworkProvider(
      'mainnet',
      mainnetCluster,
      true
    )

    return {
      provider: mainnetProvider,
      cluster: mainnetCluster,
    }
  }

  static async createChipnetNetwork() {
    const chipnetCluster = new ElectrumCluster('chipnet.bchouse.me', '1.4.1', 1)

    await Promise.all([
      // addServer(
      //   chipnetCluster,
      //   'chipnet',
      //   'chipnet.imaginary.cash',
      //   50004,
      //   ElectrumTransport.WSS.Scheme
      // ),
      // addServer(
      //   chipnetCluster,
      //   'chipnet',
      //   'cbch.loping.net',
      //   62102,
      //   ElectrumTransport.TCP_TLS.Scheme
      // ),
      addServer(
        chipnetCluster,
        'chipnet',
        'chipnet.c3-soft.com',
        64002,
        ElectrumTransport.TCP_TLS.Scheme
      ),
    ])

    const chipnetProvider = new ElectrumNetworkProvider(
      'chipnet',
      chipnetCluster,
      true
    )

    return {
      provider: chipnetProvider,
      cluster: chipnetCluster,
    }
  }

  static async create(start?: boolean) {
    const [mainnetNetwork, chipnetNetwork] = await Promise.all([
      ElectrumNetworkProviderService.createMainnetNetwork(),
      ElectrumNetworkProviderService.createChipnetNetwork(),
    ])

    const service = new ElectrumNetworkProviderService(
      mainnetNetwork,
      chipnetNetwork
    )

    if (start) {
      await service.start()
    }

    return service
  }

  async start() {
    await Promise.all([
      this.mainnet.cluster.ready(),
      this.chipnet.cluster.ready(),
    ])
  }

  async stop() {
    await Promise.all([
      this.mainnet.cluster.status === ClusterStatus.DISABLED
        ? Promise.resolve()
        : this.mainnet.cluster.shutdown(),
      this.chipnet.cluster.status === ClusterStatus.DISABLED
        ? Promise.resolve()
        : this.chipnet.cluster.shutdown(),
    ])
  }

  getElectrumCluster(network: Network) {
    if (network === 'chipnet') {
      return this.chipnet.cluster
    } else if (network === 'mainnet') {
      return this.mainnet.cluster
    } else {
      throw new Error('unsupported network: ' + network)
    }
  }

  getElectrumProvider(network: Network) {
    if (network === 'chipnet') {
      return this.chipnet.provider
    } else if (network === 'mainnet') {
      return this.mainnet.provider
    } else {
      throw new Error('unsupported network: ' + network)
    }
  }
}

async function addServer(
  cluster: ElectrumCluster,
  network: Network,
  server: string,
  port: number,
  scheme: TransportScheme
) {
  try {
    return await cluster.addServer(server, port, scheme, true)
  } catch (err) {
    return logger.error('Could not connect', server, network)
  }
}
