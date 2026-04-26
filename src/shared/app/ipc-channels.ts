export const APP = {
  GET_VERSION: 'app:getVersion',
  GET_SUITES_DIR: 'app:getSuitesDir',
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
