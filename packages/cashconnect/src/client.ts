import { ConfigCtrl } from './core/controllers/ConfigCtrl'
import { ModalCtrl, OpenOptions } from './core/controllers/ModalCtrl'
import { OptionsCtrl } from './core/controllers/OptionsCtrl'
import { ThemeCtrl } from './core/controllers/ThemeCtrl'
import {
  ConfigCtrlState,
  ModalCtrlState,
  ThemeCtrlState,
} from './core/types/controllerTypes'

/**
 * Types
 */
export type WalletConnectModalConfig = ConfigCtrlState & ThemeCtrlState
export type { ModalCtrlState, OpenOptions }

/**
 * Client
 */
export class WalletConnectClient {
  public constructor(config?: WalletConnectModalConfig) {
    ThemeCtrl.setThemeConfig(config || {})
    if (config) ConfigCtrl.setConfig(config)
    this.initUi()
  }

  private async initUi() {
    if (typeof window !== 'undefined') {
      OptionsCtrl.setIsUiLoaded(true)
    }
  }

  public openModal = ModalCtrl.open

  public closeModal = ModalCtrl.close

  public subscribeModal = ModalCtrl.subscribe

  public setTheme = ThemeCtrl.setThemeConfig
}
