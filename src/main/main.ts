import { app } from 'electron'
import path from 'path'
import { installIpcSenderGuards } from './ipcTrustedSender'
import { registerAppLifecycleHandlers } from './app/bootstrap'
import { registerAllIpcHandlers } from './app/ipcRegistration'

installIpcSenderGuards()

if (process.env.ARTQUEST_E2E_USER_DATA) {
  app.setPath('userData', path.resolve(process.env.ARTQUEST_E2E_USER_DATA))
}

registerAllIpcHandlers()
registerAppLifecycleHandlers()
