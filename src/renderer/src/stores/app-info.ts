import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import { api } from '../api'
import type { AppInfo } from '@shared/app/app-info'

export const useAppInfoStore = defineStore('app-info', () => {
  const info = reactive<AppInfo>({
    version: '',
    dataDir: '',
    suitesDir: '',
    runsDir: '',
    promptsDir: ''
  })

  async function init(): Promise<void> {
    Object.assign(info, await api.getAppInfo())
  }

  return {
    ...toRefs(info),
    init
  }
})
