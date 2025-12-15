'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserAIConfig {
  model: string
  useProxy: boolean
}

type OpenAIConfigState = {
  model: string
  useProxy: boolean
  setModel: (model: string) => void
  setUseProxy: (useProxy: boolean) => void
  getConfig: () => UserAIConfig | null
}

export const useOpenAIConfigStore = create<OpenAIConfigState>()(
  persist(
    (set, get) => ({
      model: '',
      useProxy: false,
      setModel: (model: string) => {
        set({ model })
      },
      setUseProxy: (useProxy: boolean) => {
        set({ useProxy })
      },
      getConfig: () => {
        const state = get()
        if (!state.model) {
          return null
        }
        return {
          model: state.model,
          useProxy: state.useProxy
        }
      }
    }),
    {
      name: 'openai-config-storage',
      partialize: (state) => ({
        model: state.model,
        useProxy: state.useProxy
      })
    }
  )
)
