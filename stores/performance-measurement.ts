'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import measurePerformance from '@/actions/measure'

import type { MeasureResponse } from '@/lib/measure'

type MeasurementState = {
  measurement: MeasureResponse | null
  loading: boolean
  error: string | null
  lastRun: string | null
  lastUrl: string | null
  targetUrl: string
  setTargetUrl: (url: string) => void
  runAnalysis: (url: string) => Promise<MeasureResponse | null>
}

export const useMeasurementStore = create<MeasurementState>()(
  persist(
    (set) => ({
      measurement: null,
      loading: false,
      error: null,
      lastRun: null,
      lastUrl: null,
      targetUrl: '',
      setTargetUrl: (url: string) => set({ targetUrl: url }),
      runAnalysis: async (url: string) => {
        set({ loading: true, error: null, measurement: null })

        try {
          const result = await measurePerformance(url)
          set({
            measurement: result,
            lastRun: result.measuredAt,
            lastUrl: result.measuredUrl
          })

          return result
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Measurement failed'
          set({ error: message })
          return null
        } finally {
          set({ loading: false })
        }
      }
    }),
    {
      name: 'measurement-storage',
      partialize: (state) => ({
        measurement: state.measurement,
        lastRun: state.lastRun,
        lastUrl: state.lastUrl,
        targetUrl: state.targetUrl
      })
    }
  )
)
