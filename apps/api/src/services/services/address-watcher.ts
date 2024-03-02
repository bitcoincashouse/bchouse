import { InngestEvent, inngest } from '@bchouse/inngest'
import { RequestResponse } from 'electrum-cash'
import { logger } from '~/utils/logger'
import { Network } from '../db/types'
import { ElectrumNetworkProviderService } from '../utils/getElectrumProvider'

export class AddressWatcher {
  private readonly electrumSubscriptions = new Map<
    Network,
    Map<string, Map<string, InngestEvent>>
  >()
  private electrumProviderService: ElectrumNetworkProviderService
  private readonly networkCallbacks = new Map<
    Network,
    (response: RequestResponse) => Promise<void> | void
  >()

  constructor() {}

  async start() {
    this.electrumProviderService = await ElectrumNetworkProviderService.create(
      true
    )
  }

  async stop() {
    await this.electrumProviderService.stop()
  }

  private getAddressSubscriptions(address: string, network: Network) {
    let networkSubscriptions = this.electrumSubscriptions.get(network)

    if (!networkSubscriptions) {
      networkSubscriptions = new Map<string, Map<string, InngestEvent>>()
      this.electrumSubscriptions.set(network, networkSubscriptions)
    }

    let addressSubscriptions = networkSubscriptions.get(address)

    if (!addressSubscriptions) {
      addressSubscriptions = new Map<string, InngestEvent>()
      networkSubscriptions.set(address, addressSubscriptions)
    }

    return addressSubscriptions
  }

  private getNetworkAddressNotificationCallback(network: Network) {
    let addressNotificationHandler = this.networkCallbacks.get(network)

    if (!addressNotificationHandler) {
      addressNotificationHandler = (response: RequestResponse) =>
        this.addressNotificationCallback(response, network)
      this.networkCallbacks.set(network, addressNotificationHandler)
    }

    return addressNotificationHandler
  }

  private async addressNotificationCallback(
    response: RequestResponse,
    network: Network
  ) {
    try {
      logger.info('Subscription called for', response)

      if (response instanceof Array && typeof response[0] === 'string') {
        const address = response[0]

        const addressSubscriptions = this.getAddressSubscriptions(
          address,
          network
        )

        if (!addressSubscriptions.size) {
          //Unsubscribe from address
          this.tryUnsubscribeFromAddress(address, network)
        } else {
          const events = Array.from(addressSubscriptions.values())
          await inngest.send(events)
        }
      }
    } catch (err) {
      logger.error('Error handling subscription', err)
    }
  }

  async subscribe({
    id,
    address,
    network,
    event,
  }: {
    id: string
    address: string
    network: Network
    event: InngestEvent
  }) {
    const addressSubscriptions = this.getAddressSubscriptions(address, network)
    const originalSize = addressSubscriptions.size

    //Add before to prevent concurrent unsubscribe
    addressSubscriptions.set(id, event)

    if (!originalSize) {
      logger.info('Subscribing to', address, network)

      const electrumCluster =
        this.electrumProviderService.getElectrumCluster(network)
      const addressNotificationCallback =
        this.getNetworkAddressNotificationCallback(network)

      await electrumCluster.subscribe(
        addressNotificationCallback,
        'blockchain.address.subscribe',
        address
      )

      logger.info('Subscribed to', address, network)
    }
  }

  async unsubscribe({
    id,
    address,
    network,
  }: {
    id: string
    address: string
    network: Network
  }) {
    const addressSubscriptions = this.getAddressSubscriptions(address, network)
    // Delete first to prevent dangling reference on unsubscribe
    addressSubscriptions?.delete(id)
    // Attempt to unsubscribe
    await this.tryUnsubscribeFromAddress(address, network)
  }

  private async tryUnsubscribeFromAddress(address: string, network: Network) {
    const addressSubscriptions = this.getAddressSubscriptions(address, network)

    if (!addressSubscriptions?.size) {
      const electrumCluster =
        this.electrumProviderService.getElectrumCluster(network)
      const addressNotificationCallback =
        this.getNetworkAddressNotificationCallback(network)

      const isSubscribed = Object.values(electrumCluster.clients).some(
        (client) => {
          const method = 'blockchain.address.subscribe'
          const subscriptionParameters = JSON.stringify([address])
          const methodSubscription =
            client.connection.subscriptionMethods[method]
          const callbacks = client.connection.subscriptionCallbacks.get(
            addressNotificationCallback
          )
          const serverMethodPayloadIndex = methodSubscription?.indexOf(
            subscriptionParameters
          )
          const callbackMethodPayloadIndex = callbacks?.findIndex(
            (value) =>
              value.method === method &&
              value.payload === subscriptionParameters
          )

          const hasSubscription =
            serverMethodPayloadIndex !== undefined &&
            callbackMethodPayloadIndex !== undefined &&
            serverMethodPayloadIndex > -1 &&
            callbackMethodPayloadIndex > -1

          return hasSubscription
        }
      )

      if (isSubscribed) {
        await electrumCluster.unsubscribe(
          addressNotificationCallback,
          'blockchain.address.subscribe',
          address
        )
      }
    }
  }
}
