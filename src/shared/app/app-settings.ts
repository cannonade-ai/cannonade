export const DEFAULT_LM_STUDIO_PORT = 1234

export interface AppSettings {
  lmStudioPort: number
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  lmStudioPort: DEFAULT_LM_STUDIO_PORT
}
