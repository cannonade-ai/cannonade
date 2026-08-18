import { defineStore } from 'pinia'
import { computed, reactive, toRefs } from 'vue'
import { api } from '../api'
import { UpdateStatus, type UpdateState } from '@shared/app/update-info'

export const useUpdaterStore = defineStore('updater', () => {
  const state = reactive<UpdateState>({
    status: UpdateStatus.Idle,
    currentVersion: '',
    latestVersion: '',
    percent: 0,
    error: ''
  })

  const hasUpdate = computed(
    () =>
      state.status === UpdateStatus.Available ||
      state.status === UpdateStatus.Downloading ||
      state.status === UpdateStatus.Ready
  )

  const isDownloading = computed(() => state.status === UpdateStatus.Downloading)
  const isReady = computed(() => state.status === UpdateStatus.Ready)
  const hasError = computed(() => state.status === UpdateStatus.Error)

  async function init(): Promise<void> {
    Object.assign(state, await api.getUpdateState())
    api.onUpdateState((next) => Object.assign(state, next))
  }

  function download(): void {
    api.downloadUpdate()
  }

  function install(): void {
    api.installUpdate()
  }

  return {
    ...toRefs(state),
    hasUpdate,
    isDownloading,
    isReady,
    hasError,
    init,
    download,
    install
  }
})
