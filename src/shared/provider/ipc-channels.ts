export const PROVIDER = {
  FETCH_LOCAL_MODELS: 'provider:fetchLocalModels',
  FETCH_EXTERNAL_MODELS: 'provider:fetchExternalModels',
  CHAT: 'provider:chat',
  CHAT_ABORT: 'provider:chatAbort',
  DOWNLOAD_MODEL: 'provider:downloadModel',
  DOWNLOAD_MODEL_STATUS: 'provider:downloadModelStatus',
  DELETE_MODEL: 'provider:deleteModel',
  DELETE_MODEL_BY_HF_ID: 'provider:deleteModelByHfId',
  LOAD_MODEL: 'provider:loadModel',
  UNLOAD_MODEL: 'provider:unloadModel',
  SERVER_STATUS: 'provider:serverStatus',
  SERVER_START: 'provider:serverStart',
  SERVER_STOP: 'provider:serverStop',
  GET_CAPABILITIES: 'provider:getCapabilities',
  TEST_CONNECTION: 'provider:testConnection',
  TEST_CONNECTION_URL: 'provider:testConnectionUrl',
  SYNC: 'provider:sync'
} as const

export const SECRETS = {
  GET_INFO: 'secrets:getInfo',
  SET: 'secrets:set',
  DELETE: 'secrets:delete'
} as const
