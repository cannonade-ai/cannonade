export const APP = {
  GET_VERSION: 'app:getVersion',
  GET_SUITES_DIR: 'app:getSuitesDir',
  GET_RUNS_DIR: 'app:getRunsDir',
  OPEN_PATH: 'app:openPath',
  MINIMIZE: 'app:minimize',
  MAXIMIZE: 'app:maximize',
  CLOSE: 'app:close'
} as const

export const SUITES = {
  LIST: 'suites:list',
  SAVE: 'suites:save',
  DELETE: 'suites:delete'
} as const

export const SETTINGS = {
  LOAD: 'settings:load',
  SAVE: 'settings:save'
} as const

export const TEST_RUNS = {
  LIST: 'test-runs:list',
  SAVE: 'test-runs:save',
  DELETE: 'test-runs:delete'
} as const

export const EVAL = {
  RUN: 'eval:run'
} as const
