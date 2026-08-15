import { execFile } from 'child_process'
import { accessSync, constants } from 'fs'
import { delimiter, isAbsolute, join, sep } from 'path'
import { createLogger } from '../logger'

const log = createLogger('executable-path')

const SHELL_TIMEOUT_MS = 5000
const PATH_MARKER = '__CANNONADE_PATH__'

let shellPathPromise: Promise<void> | null = null

const resolved = new Map<string, string>()

function readShellPath(): Promise<string> {
  return new Promise((resolve) => {
    const shell = process.env.SHELL || '/bin/zsh'
    const script = `command printf '%s\\n%s\\n%s\\n' ${PATH_MARKER} "$PATH" ${PATH_MARKER}`
    execFile(
      shell,
      ['-ilc', script],
      {
        timeout: SHELL_TIMEOUT_MS,
        killSignal: 'SIGKILL',
        env: { ...process.env, TERM: 'dumb' }
      },
      (err, stdout) => {
        if (err) log.debug(`Could not read PATH from ${shell}:`, err)
        const match = stdout.match(new RegExp(`${PATH_MARKER}\\n([\\s\\S]*?)\\n${PATH_MARKER}`))
        resolve(match?.[1]?.trim() ?? '')
      }
    )
  })
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

export function ensureShellPath(): Promise<void> {
  if (!shellPathPromise) {
    shellPathPromise = (async () => {
      if (process.platform === 'win32') return
      try {
        const shellPath = await readShellPath()
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
        log.warn('Failed to import PATH from the login shell:', err)
      }
    })()
  }
  return shellPathPromise
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
    await ensureShellPath()

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
