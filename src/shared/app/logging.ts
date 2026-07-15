export const LOG_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'] as const

export type LogLevel = (typeof LOG_LEVELS)[number]

export interface LogEntry {
  seq: number
  timestamp: string
  level: LogLevel
  scope: string
  message: string
}

export interface LogFile {
  name: string
  sizeBytes: number
  modifiedAt: string
}
