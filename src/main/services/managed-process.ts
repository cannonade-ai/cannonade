import { spawn, execFile } from 'child_process'
import { basename } from 'path'
import { getAppState, saveManagedServers, type ManagedServerRecord } from '../app-state'
import { getAppSettings } from '../ipc/settings-handlers'
import { createLogger } from '../logger'
import { resolveExecutable, resolvedEnvironment } from './executable-path'

const log = createLogger('managed-process')

const TERMINATE_GRACE_MS = 3000
const EXIT_POLL_INTERVAL_MS = 200

interface TrackedProcess {
  pid: number
  executable: string
}

const tracked = new Map<string, TrackedProcess>()

let shuttingDown = false

function run(command: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    execFile(command, args, { windowsHide: true }, (_err, stdout, stderr) => {
      resolve((stdout || stderr).trim())
    })
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function isPidAlive(pid: number, executable: string): Promise<boolean> {
  const expected = basename(executable).toLowerCase()
  if (process.platform === 'win32') {
    const output = await run('tasklist', ['/FI', `PID eq ${pid}`, '/NH', '/FO', 'CSV'])
    const processName = output.toLowerCase().match(/^"([^"]*)"/)?.[1]
    if (!processName) return false
    return processName === expected || processName === `${expected}.exe`
  }
  const output = await run('ps', ['-p', String(pid), '-o', 'comm='])
  if (!output) return false
  return basename(output).toLowerCase() === expected
}

function persist(): void {
  const records: Record<string, ManagedServerRecord> = {}
  for (const [key, entry] of tracked) {
    records[key] = { pid: entry.pid, executable: entry.executable }
  }
  saveManagedServers(records)
}

async function waitForExit(pid: number, executable: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!(await isPidAlive(pid, executable))) return true
    await delay(EXIT_POLL_INTERVAL_MS)
  }
  return !(await isPidAlive(pid, executable))
}

function signalGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal)
    return
  } catch (err) {
    log.debug(`Group ${signal} failed for pid ${pid}, falling back to single pid:`, err)
  }
  try {
    process.kill(pid, signal)
  } catch (err) {
    log.debug(`${signal} failed for pid ${pid}:`, err)
  }
}

function reapGroup(pid: number | undefined): void {
  if (process.platform === 'win32' || !pid) return
  try {
    process.kill(-pid, 'SIGKILL')
    log.warn(`Killed processes left behind in the process group of pid ${pid}`)
  } catch (err) {
    log.debug(`No survivors in the process group of pid ${pid}:`, err)
  }
}

async function terminate(pid: number, executable: string): Promise<boolean> {
  if (process.platform === 'win32') {
    const output = await run('taskkill', ['/pid', String(pid), '/T', '/F'])
    log.debug(`taskkill output for pid ${pid}:`, output)
    return waitForExit(pid, executable, TERMINATE_GRACE_MS)
  }

  signalGroup(pid, 'SIGTERM')
  if (await waitForExit(pid, executable, TERMINATE_GRACE_MS)) return true

  log.warn(`pid ${pid} ignored SIGTERM, sending SIGKILL`)
  signalGroup(pid, 'SIGKILL')
  return waitForExit(pid, executable, TERMINATE_GRACE_MS)
}

export function isManagedProcess(key: string): boolean {
  return tracked.has(key)
}

export async function startManagedProcess(
  key: string,
  command: string,
  args: string[],
  env?: Record<string, string>
): Promise<number> {
  if (!getAppSettings().experiments.cannonadeManagedServers) {
    throw new Error('Cannonade-managed servers is disabled in Experiments settings')
  }

  const executable = await resolveExecutable(command)

  return new Promise((resolve, reject) => {
    log.info(`Starting managed process "${key}": ${executable} ${args.join(' ')}`)
    const child = spawn(executable, args, {
      windowsHide: true,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: env ? { ...resolvedEnvironment(), ...env } : resolvedEnvironment()
    })

    child.stdout?.on('data', (chunk: Buffer) => log.silly(`[${key}] ${chunk.toString().trim()}`))
    child.stderr?.on('data', (chunk: Buffer) => log.silly(`[${key}] ${chunk.toString().trim()}`))

    child.once('error', (err) => {
      tracked.delete(key)
      log.error(`Managed process "${key}" failed to spawn:`, err)
      reject(err)
    })

    child.once('spawn', () => {
      const pid = child.pid!
      tracked.set(key, { pid, executable })
      log.info(`Managed process "${key}" started with pid ${pid}`)
      persist()
      if (shuttingDown) {
        log.warn(`Managed process "${key}" spawned during shutdown, stopping it immediately`)
        void stopManagedProcess(key)
      }
      resolve(pid)
    })

    child.once('exit', (code, signal) => {
      log.info(`Managed process "${key}" exited. code: ${code}, signal: ${signal}`)
      tracked.delete(key)
      reapGroup(child.pid)
      persist()
    })
  })
}

export async function stopManagedProcess(key: string): Promise<void> {
  const entry = tracked.get(key)
  if (!entry) {
    log.debug(`No managed process tracked for "${key}"`)
    return
  }

  log.info(`Stopping managed process "${key}" (pid ${entry.pid})`)
  const stopped = await terminate(entry.pid, entry.executable)
  if (stopped) {
    tracked.delete(key)
  } else {
    log.error(
      `Managed process "${key}" (pid ${entry.pid}) survived termination, keeping it tracked for the next session`
    )
  }
  persist()
}

export async function stopAllManagedProcesses(): Promise<void> {
  shuttingDown = true
  const keys = [...tracked.keys()]
  if (!keys.length) return
  log.info(`Stopping ${keys.length} managed process(es) before quit`)
  await Promise.all(keys.map((key) => stopManagedProcess(key)))
  if (tracked.size) {
    log.error(`${tracked.size} managed process(es) could not be stopped: ${[...tracked.keys()]}`)
  }
}

export async function adoptManagedProcesses(): Promise<void> {
  const records = getAppState().managedServers
  const keys = Object.keys(records)
  if (!keys.length) return

  for (const key of keys) {
    const { pid, executable } = records[key]
    if (await isPidAlive(pid, executable)) {
      tracked.set(key, { pid, executable })
      log.info(`Adopted managed process "${key}" (pid ${pid}) from a previous session`)
    } else {
      log.debug(`Dropping stale managed process record "${key}" (pid ${pid})`)
    }
  }

  persist()
}
