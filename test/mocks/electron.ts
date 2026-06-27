import { vi } from 'vitest'

export const app = {
  getPath: vi.fn((): string => '/tmp'),
  getName: vi.fn((): string => 'cannonade'),
  getVersion: vi.fn((): string => '0.0.0'),
  on: vi.fn(),
  whenReady: vi.fn((): Promise<void> => Promise.resolve()),
  quit: vi.fn()
}

export const safeStorage = {
  isEncryptionAvailable: vi.fn((): boolean => false),
  encryptString: vi.fn((value: string): Buffer => Buffer.from(value)),
  decryptString: vi.fn((value: Buffer): string => value.toString())
}

export const ipcMain = {
  handle: vi.fn(),
  on: vi.fn(),
  removeHandler: vi.fn()
}

export const ipcRenderer = {
  invoke: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn()
}

export const contextBridge = {
  exposeInMainWorld: vi.fn()
}

export const shell = {
  openExternal: vi.fn((): Promise<void> => Promise.resolve()),
  openPath: vi.fn((): Promise<string> => Promise.resolve(''))
}

export const BrowserWindow = vi.fn(() => ({
  loadURL: vi.fn(),
  loadFile: vi.fn(),
  on: vi.fn(),
  webContents: { send: vi.fn(), on: vi.fn() }
}))

export default { app, safeStorage, ipcMain, ipcRenderer, contextBridge, shell, BrowserWindow }
