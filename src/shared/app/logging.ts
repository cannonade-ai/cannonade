export const LOG_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'] as const

export type LogLevel = (typeof LOG_LEVELS)[number]

export interface LogEntry {
  timestamp: string
  level: LogLevel
  scope: string
  message: string
}
