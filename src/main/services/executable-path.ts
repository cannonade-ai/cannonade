import { accessSync, constants } from 'fs'
import { delimiter, isAbsolute, join, sep } from 'path'
import { shellEnv } from 'shell-env'
import { createLogger } from '../logger'

const log = createLogger('executable-path')

const SHELL_TIMEOUT_MS = 5000

let shellEnvironmentPromise: Promise<void> | null = null
let shellEnvironment: Record<string, string> = {}

const resolved = new Map<string, string>()

function readShellEnvironment(): Promise<Record<string, string>> {
  const expiry = new Promise<Record<string, string>>((resolve) => {
    setTimeout(() => {
      log.warn(`Login shell did not answer within ${SHELL_TIMEOUT_MS}ms, ignoring its environment`)
      resolve({})
    }, SHELL_TIMEOUT_MS).unref()
  })
  return Promise.race([shellEnv(), expiry])
}

function mergePath(shellPath: string): string {
  const seen = new Set<string>()
  const entries: string[] = []
  for (const entry of [
    ...shellPath.split(delimiter),
    ...(process.env.PATH ?? '').split(delimiter)
  ]) {
    const trimmed = entry.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    entries.push(trimmed)
  }
  return entries.join(delimiter)
}

export function ensureShellEnvironment(): Promise<void> {
  if (!shellEnvironmentPromise) {
    shellEnvironmentPromise = (async () => {
      if (process.platform === 'win32') return
      try {
        shellEnvironment = await readShellEnvironment()

        const extra = Object.keys(shellEnvironment).filter((name) => !(name in process.env))
        if (extra.length) {
          log.debug(`Login shell provided ${extra.length} variables the app did not inherit`)
        }

        const shellPath = shellEnvironment.PATH?.trim() ?? ''
        if (!shellPath) {
          log.debug('Login shell returned no PATH, keeping the inherited one')
          return
        }
        const merged = mergePath(shellPath)
        if (merged !== process.env.PATH) {
          log.info('Imported PATH from the login shell')
          log.debug('PATH is now:', merged)
          process.env.PATH = merged
        }
      } catch (err) {
        log.warn('Failed to read the login shell environment:', err)
      }
    })()
  }
  return shellEnvironmentPromise
}

export function resolvedEnvironment(): NodeJS.ProcessEnv {
  return { ...shellEnvironment, ...process.env }
}

function isExecutable(candidate: string): boolean {
  try {
    accessSync(candidate, constants.X_OK)
    return true
  } catch {
    return false
  }
}

function findOnPath(command: string): string | null {
  const extensions =
    process.platform === 'win32' ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : ['']
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    if (!dir.trim()) continue
    for (const extension of extensions) {
      const candidate = join(dir.trim(), `${command}${extension}`)
      if (isExecutable(candidate)) return candidate
    }
  }
  return null
}

export async function resolveExecutable(command: string): Promise<string> {
  if (isAbsolute(command) || command.includes(sep)) return command

  const cached = resolved.get(command)
  if (cached) return cached

  try {
    await ensureShellEnvironment()

    const fromPath = findOnPath(command)
    if (fromPath) {
      log.debug(`Resolved "${command}" from PATH:`, fromPath)
      resolved.set(command, fromPath)
      return fromPath
    }
  } catch (err) {
    log.warn(`Failed to resolve "${command}":`, err)
  }

  log.debug(`Could not resolve "${command}", running it as-is`)
  return command
}
