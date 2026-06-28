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
  DELETE: 'test-runs:delete'
} as const

export const RUN = {
  START: 'run:start',
  ABORT: 'run:abort',
  STARTED: 'run:started',
  COMPLETED: 'run:completed',
  MODEL_DOWNLOADING: 'run:model:downloading',
  MODEL_LOADING: 'run:model:loading',
  MODEL_STARTED: 'run:model:started',
  MODEL_COMPLETED: 'run:model:completed',
  CASE_STARTED: 'run:case:started',
  CASE_COMPLETED: 'run:case:completed'
} as const
