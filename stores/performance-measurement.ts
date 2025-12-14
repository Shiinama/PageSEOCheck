'use client'

import { create } from 'zustand'

import measurePerformance from '@/actions/measure'

import type { MeasureResponse } from '@/lib/measure'

type MeasurementState = {
  measurement: MeasureResponse | null
  loading: boolean
  error: string | null
  lastRun: string | null
  lastUrl: string | null
  runAnalysis: (url: string) => Promise<MeasureResponse | null>
}

export const useMeasurementStore = create<MeasurementState>((set) => ({
  measurement: null,
  loading: false,
  error: null,
  lastRun: null,
  lastUrl: null,
  runAnalysis: async (url: string) => {
    set({ loading: true, error: null, measurement: null })

    try {
      const result = await measurePerformance(url)
      set({
        measurement: result,
        lastRun: result.measuredAt,
        lastUrl: result.measuredUrl
      })

      // Update ranking asynchronously (don't wait for it)
      fetch('/api/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurement: result })
      }).catch((err) => {
        console.error('Failed to update ranking:', err)
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
}))
