import { describe, it, expect } from 'vitest'
import { parseLogFile } from './log-files'

const SAMPLE = [
  '[2026-07-15 14:32:09.603] [debug] (provider-registry) > Configured providers: [',
  '  {',
  "    instanceId: '6df19705-4efa-4772-96ba-32f2a0052b2e',",
  "    type: 'lmstudio',",
  "    url: 'http://localhost:1234'",
  '  }',
  ']',
  '[2026-07-15 14:32:09.607] [debug] (app-settings) > App settings loaded successfully',
  "[2026-07-15 14:32:09.607] [info]  (electron-main) > App starting { version: '0.3.12' }",
  '[2026-07-15 14:32:09.608] [info]  (ipc-handlers) > registering ipc handlers',
  '[2026-07-15 14:40:20.678] [error] (cosine-similarity) Cosine similarity evaluation failed: Error: model load failed',
  '    at D:/Code/js/cannonade/src/main/eval/cosineSimilarity.test.ts:103:53',
  '    at processTicksAndRejections (node:internal/process/task_queues:104:5)',
  '[2026-07-15 14:40:20.761] [info]  (test-runner)       Starting test run: run-1',
  '[2026-07-15 14:40:20.766] [info]  (model-runner)      Loading model: llama-3, modelRun: mr-1'
].join('\n')

describe('parseLogFile', () => {
  const entries = parseLogFile(SAMPLE)

  it('parses each prefixed line as its own entry', () => {
    expect(entries).toHaveLength(7)
  })

  it('parses timestamp, level, scope and message', () => {
    expect(entries[1]).toEqual({
      seq: 1,
      timestamp: new Date('2026-07-15T14:32:09.607').toISOString(),
      level: 'debug',
      scope: 'app-settings',
      message: 'App settings loaded successfully'
    })
  })

  it('handles padded level tags', () => {
    expect(entries[2].level).toBe('info')
    expect(entries[2].scope).toBe('electron-main')
    expect(entries[2].message).toBe("App starting { version: '0.3.12' }")
    expect(entries[3].message).toBe('registering ipc handlers')
  })

  it('attaches continuation lines to the previous entry', () => {
    expect(entries[0].scope).toBe('provider-registry')
    expect(entries[0].message).toContain('Configured providers: [')
    expect(entries[0].message).toContain("type: 'lmstudio',")
    expect(entries[0].message.split('\n')).toHaveLength(7)
  })

  it('parses lines without a > separator', () => {
    expect(entries[4].level).toBe('error')
    expect(entries[4].scope).toBe('cosine-similarity')
    expect(entries[4].message).toContain('Cosine similarity evaluation failed')
    expect(entries[4].message).toContain('at processTicksAndRejections')
  })

  it('trims scope padding from the message', () => {
    expect(entries[5].scope).toBe('test-runner')
    expect(entries[5].message).toBe('Starting test run: run-1')
    expect(entries[6].scope).toBe('model-runner')
    expect(entries[6].message).toBe('Loading model: llama-3, modelRun: mr-1')
  })

  it('returns an empty list for empty content', () => {
    expect(parseLogFile('')).toEqual([])
  })

  it('falls back to info for unknown levels', () => {
    const parsed = parseLogFile('[2026-07-15 14:32:09.607] [custom] (scope) > hello')
    expect(parsed[0].level).toBe('info')
    expect(parsed[0].message).toBe('hello')
  })
})
