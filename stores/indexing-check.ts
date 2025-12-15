'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { checkIndexing, type IndexingCheckResult } from '@/actions/indexing-check'

type IndexingCheckState = {
  result: IndexingCheckResult | null
  loading: boolean
  error: string | null
  lastChecked: string | null
  lastUrl: string | null
  checkIndexing: (url: string) => Promise<IndexingCheckResult | null>
}

export const useIndexingCheckStore = create<IndexingCheckState>()(
  persist(
    (set) => ({
      result: null,
      loading: false,
      error: null,
      lastChecked: null,
      lastUrl: null,
      checkIndexing: async (url: string) => {
        set({ loading: true, error: null, result: null })

        try {
          const result = await checkIndexing(url, ['chatgpt'])
          console.log(result)
          set({
            result,
            lastChecked: result.checkedAt,
            lastUrl: url
          })

          return result
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Indexing check failed'
          set({ error: message })
          return null
        } finally {
          set({ loading: false })
        }
      }
    }),
    {
      name: 'indexing-check-storage',
      partialize: (state) => ({
        result: state.result,
        lastChecked: state.lastChecked,
        lastUrl: state.lastUrl
      })
    }
  )
)
